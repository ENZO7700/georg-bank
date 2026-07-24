import WidgetKit
import SwiftUI

struct GeorgeEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
}

struct GeorgeProvider: TimelineProvider {
    func placeholder(in context: Context) -> GeorgeEntry {
        GeorgeEntry(date: Date(), snapshot: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (GeorgeEntry) -> Void) {
        completion(GeorgeEntry(date: Date(), snapshot: WidgetSnapshotStore.loadOrPlaceholder()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GeorgeEntry>) -> Void) {
        let entry = GeorgeEntry(date: Date(), snapshot: WidgetSnapshotStore.loadOrPlaceholder())
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct GeorgeHomeWidget: Widget {
    let kind = "GeorgeHomeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GeorgeProvider()) { entry in
            GeorgeWidgetView(entry: entry)
        }
        .configurationDisplayName("George Pohyby")
        .description("Zostatok, denný limit a posledná platba.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct GeorgeWidgetView: View {
    @Environment(\.widgetFamily) private var family
    var entry: GeorgeEntry

    private var snapshot: WidgetSnapshot { entry.snapshot }

    private var deepLinkURL: URL {
        URL(string: snapshot.deepLink.openPohyby) ?? URL(string: "george://pohyby")!
    }

    private var background: LinearGradient {
        LinearGradient(
            colors: [
                Color(red: 0.07, green: 0.11, blue: 0.18),
                Color(red: 0.05, green: 0.09, blue: 0.16),
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var body: some View {
        ZStack {
            background
            Group {
                if family == .systemSmall {
                    smallLayout
                } else {
                    mediumLayout
                }
            }
            .padding(12)
        }
        .widgetURL(deepLinkURL)
        .foregroundColor(.white)
    }

    private var mediumLayout: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(snapshot.profile.displayName.isEmpty ? "George" : snapshot.profile.displayName)
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer(minLength: 8)
                Text(relativeUpdated(snapshot.updatedAt))
                    .font(.caption2)
                    .foregroundColor(Color.white.opacity(0.55))
            }

            if snapshot.settings.showBalance {
                Text(formatEur(snapshot.money.balanceCents))
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
            }

            if snapshot.settings.showDailyLimit {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Denný limit")
                            .font(.caption2)
                            .foregroundColor(Color.white.opacity(0.65))
                        Spacer()
                        Text(formatEur(snapshot.dailyLimit.remainingCents) + " zostáva")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(Color(red: 0.45, green: 0.78, blue: 0.95))
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.white.opacity(0.12))
                            Capsule()
                                .fill(Color(red: 0.35, green: 0.72, blue: 0.95))
                                .frame(width: max(4, geo.size.width * usedFraction))
                        }
                    }
                    .frame(height: 6)
                }
            }

            if snapshot.settings.showLastPayment, let last = snapshot.money.lastPayment {
                HStack(spacing: 6) {
                    Text(last.label)
                        .font(.caption)
                        .lineLimit(1)
                        .foregroundColor(Color.white.opacity(0.8))
                    Spacer(minLength: 4)
                    Text(formatSignedEur(last.amountCents))
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(
                            last.amountCents < 0
                                ? Color(red: 0.95, green: 0.45, blue: 0.45)
                                : Color(red: 0.40, green: 0.85, blue: 0.55)
                        )
                }
            }
        }
    }

    private var smallLayout: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(snapshot.profile.displayName.isEmpty ? "George" : snapshot.profile.displayName)
                .font(.caption)
                .fontWeight(.semibold)
                .lineLimit(1)
            if snapshot.settings.showBalance {
                Text(formatEur(snapshot.money.balanceCents))
                    .font(.title3)
                    .fontWeight(.bold)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
            }
            if snapshot.settings.showDailyLimit {
                Text(formatEur(snapshot.dailyLimit.remainingCents))
                    .font(.caption2)
                    .foregroundColor(Color(red: 0.45, green: 0.78, blue: 0.95))
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.white.opacity(0.12))
                        Capsule()
                            .fill(Color(red: 0.35, green: 0.72, blue: 0.95))
                            .frame(width: max(4, geo.size.width * usedFraction))
                    }
                }
                .frame(height: 5)
            }
        }
    }

    private var usedFraction: CGFloat {
        let limit = max(snapshot.dailyLimit.limitCents, 1)
        return CGFloat(min(1, max(0, Double(snapshot.dailyLimit.usedCents) / Double(limit))))
    }

    private func formatEur(_ cents: Int) -> String {
        let value = Double(cents) / 100.0
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "EUR"
        formatter.locale = Locale(identifier: "sk_SK")
        return formatter.string(from: NSNumber(value: value)) ?? String(format: "%.2f €", value)
    }

    private func formatSignedEur(_ cents: Int) -> String {
        let absStr = formatEur(abs(cents))
        return cents < 0 ? "−\(absStr)" : "+\(absStr)"
    }

    private func relativeUpdated(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var date = formatter.date(from: iso)
        if date == nil {
            formatter.formatOptions = [.withInternetDateTime]
            date = formatter.date(from: iso)
        }
        guard let date else { return "" }
        let seconds = max(0, Int(Date().timeIntervalSince(date)))
        if seconds < 60 { return "práve teraz" }
        if seconds < 3600 { return "pred \(seconds / 60) min" }
        if seconds < 86_400 { return "pred \(seconds / 3600) h" }
        return "pred \(seconds / 86_400) d"
    }
}

#if DEBUG
struct GeorgeWidgetView_Previews: PreviewProvider {
    static var previews: some View {
        GeorgeWidgetView(entry: GeorgeEntry(date: Date(), snapshot: .placeholder))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}
#endif
