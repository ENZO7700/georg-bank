import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { transaction } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateTransactionsPdf } from '@/lib/generate-transactions-pdf'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Configure Web Push with VAPID keys from env
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@george.sk',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabase = (supabaseUrl && supabaseKey) 
  ? createSupabaseClient(supabaseUrl, supabaseKey) 
  : null

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { transactionId, recipientId, description } = data

    console.log(`[Worker] Processing payment ${transactionId}...`)

    // Fetch transaction details from local database
    const txnRecord = await db.query.transaction.findFirst({
      where: (table, { eq }) => eq(table.id, transactionId)
    })

    if (!txnRecord) {
      console.error(`[Worker] Transaction ${transactionId} not found in local DB.`)
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
    }

    // Fetch sender details and bank account
    const fromAccount = txnRecord.fromAccountId ? await db.query.bankAccount.findFirst({
      where: (table, { eq }) => eq(table.id, txnRecord.fromAccountId!)
    }) : null

    const senderUser = await db.query.user.findFirst({
      where: (table, { eq }) => eq(table.id, txnRecord.userId)
    })

    // Prepare inputs for the SLSP PDF generator
    const dateFormatted = txnRecord.createdAt.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\s/g, '')
    const amountVal = txnRecord.amount

    const pdfInput = {
      accountName: senderUser?.name || 'Klient',
      accountNumber: fromAccount?.accountNumber || '',
      currency: fromAccount?.currency || 'EUR',
      dateCreated: txnRecord.createdAt.toLocaleDateString('sk-SK'),
      transactions: [
        {
          id: txnRecord.id,
          date: dateFormatted,
          type: txnRecord.type,
          description: txnRecord.description,
          amount: amountVal,
          balanceAfter: txnRecord.balanceAfter
        }
      ],
      initialBalance: txnRecord.balanceBefore || 0,
      finalBalance: txnRecord.balanceAfter || 0,
      depositsTotal: txnRecord.type === 'deposit' ? amountVal : 0,
      withdrawalsTotal: (txnRecord.type === 'withdrawal' || txnRecord.type === 'transfer') ? amountVal : 0
    }

    // Generate styled PDF using the revamped pdfmake module
    console.log('[Worker] Generating Server PDF with pdfmake...')
    const pdfBuffer = await generateTransactionsPdf(pdfInput)

    // Save/Upload the PDF
    let finalPdfUrl = ''

    // 1. Upload to Supabase Storage if configured
    if (supabase) {
      try {
        console.log('[Worker] Uploading PDF to Supabase Storage receipts bucket...')
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(`receipts/${transactionId}.pdf`, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(`receipts/${transactionId}.pdf`)
          finalPdfUrl = urlData.publicUrl
          console.log('[Worker] Uploaded successfully to Supabase Storage:', finalPdfUrl)
        } else {
          console.error('[Worker] Supabase upload failed, fallback to vercel blob / local:', uploadError.message)
        }
      } catch (err) {
        console.error('[Worker] Supabase storage upload error:', err)
      }
    }

    // 2. Fallback to Vercel Blob or local storage if Supabase upload was not configured or failed
    if (!finalPdfUrl) {
      try {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          const blob = await put(`receipts/${transactionId}.pdf`, pdfBuffer, {
            access: 'public',
            contentType: 'application/pdf',
          })
          finalPdfUrl = blob.url
          console.log('[Worker] Uploaded to Vercel Blob:', finalPdfUrl)
        } else {
          throw new Error('No BLOB_READ_WRITE_TOKEN')
        }
      } catch (err) {
        console.log('[Worker] Vercel Blob unavailable, falling back to local storage.', err)
        const publicPdfDir = path.join(process.cwd(), 'public', 'pdfs')
        if (!fs.existsSync(publicPdfDir)) fs.mkdirSync(publicPdfDir, { recursive: true })
        const filePath = path.join(publicPdfDir, `${transactionId}.pdf`)
        fs.writeFileSync(filePath, pdfBuffer)
        finalPdfUrl = `/pdfs/${transactionId}.pdf`
      }
    }

    // Update Local DB with PDF URL
    console.log('[Worker] Updating Local Database with PDF URL...')
    await db.update(transaction)
      .set({ pdfUrl: finalPdfUrl })
      .where(eq(transaction.id, transactionId))

    // 3. Sync details to Supabase Database
    if (supabase) {
      try {
        console.log('[Worker] Syncing data to Supabase Database...')
        
        // Ensure user exists in Supabase
        if (senderUser) {
          await supabase.from('user').upsert({
            id: senderUser.id,
            name: senderUser.name,
            email: senderUser.email,
            emailVerified: senderUser.emailVerified,
            image: senderUser.image,
            createdAt: senderUser.createdAt.toISOString(),
            updatedAt: senderUser.updatedAt.toISOString()
          })
        }

        // Ensure bank account exists in Supabase
        if (fromAccount) {
          await supabase.from('bank_account').upsert({
            id: fromAccount.id,
            userId: fromAccount.userId,
            accountNumber: fromAccount.accountNumber,
            accountType: fromAccount.accountType,
            balance: fromAccount.balance,
            currency: fromAccount.currency,
            isActive: fromAccount.isActive,
            createdAt: fromAccount.createdAt.toISOString(),
            updatedAt: fromAccount.updatedAt.toISOString()
          })
        }

        // Upsert transaction record in Supabase
        const { error: syncError } = await supabase.from('transaction').upsert({
          id: txnRecord.id,
          userId: txnRecord.userId,
          fromAccountId: txnRecord.fromAccountId,
          toAccountId: txnRecord.toAccountId,
          amount: txnRecord.amount,
          balanceBefore: txnRecord.balanceBefore,
          balanceAfter: txnRecord.balanceAfter,
          type: txnRecord.type,
          description: txnRecord.description,
          pdfUrl: finalPdfUrl,
          status: txnRecord.status,
          createdAt: txnRecord.createdAt.toISOString(),
          updatedAt: txnRecord.updatedAt.toISOString()
        })

        if (syncError) {
          console.error('[Worker] Supabase DB sync error:', syncError.message)
        } else {
          console.log('[Worker] Successfully synced transaction to Supabase Database')
        }
      } catch (err) {
        console.error('[Worker] Error during Supabase Database sync:', err)
      }
    }

    // 4. Send Web Push Notification to the user
    console.log('[Worker] Sending Push Notification...')
    if (recipientId && process.env.VAPID_PRIVATE_KEY) {
      const subscriptions = await db.query.pushSubscription.findMany({
        where: (table, { eq }) => eq(table.userId, recipientId)
      })

      if (subscriptions.length > 0) {
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              }
            }, JSON.stringify({
              title: 'Prijatá platba!',
              body: `Prijali ste platbu vo výške € ${(amountVal / 100).toFixed(2).replace('.', ',')}. Popis: ${description}`,
              url: '/dashboard'
            }))
            console.log('[Worker] Push notification sent to recipient.')
          } catch (e) {
            console.error('[Worker] Failed to send push notification to subscription', e)
          }
        }
      } else {
        console.log('[Worker] Recipient has no push subscriptions.')
      }
    } else {
      console.log('[Worker] No recipientId or VAPID keys, skipping Push.')
    }

    return NextResponse.json({ success: true, pdfUrl: finalPdfUrl })

  } catch (error) {
    console.error('[Worker] Payment processing failed:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
