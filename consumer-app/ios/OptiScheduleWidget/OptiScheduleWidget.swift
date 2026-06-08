import WidgetKit
import SwiftUI

struct WidgetSnapshotSection: Codable {
    let title: String
    let serviceName: String
    let subtitle: String
    let deepLinkUrl: String
}

struct WidgetSnapshotSignedOut: Codable {
    let title: String
    let subtitle: String
    let deepLinkUrl: String
}

struct WidgetSnapshot: Codable {
    let version: Int
    let updatedAt: String
    let slug: String
    let businessName: String
    let authed: Bool
    let nextAppointment: WidgetSnapshotSection?
    let quickRebook: WidgetSnapshotSection?
    let signedOut: WidgetSnapshotSignedOut?
}

enum WidgetSnapshotReader {
    static let appGroup = "group.com.optischedule.consumer"
    static let snapshotKey = "home_screen_widget_snapshot"

    static func load() -> WidgetSnapshot? {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let raw = defaults.string(forKey: snapshotKey),
            let data = raw.data(using: .utf8)
        else {
            return nil
        }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }
}

struct OptiScheduleWidgetEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
}

struct OptiScheduleWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> OptiScheduleWidgetEntry {
        OptiScheduleWidgetEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (OptiScheduleWidgetEntry) -> Void) {
        completion(OptiScheduleWidgetEntry(date: Date(), snapshot: WidgetSnapshotReader.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<OptiScheduleWidgetEntry>) -> Void) {
        let entry = OptiScheduleWidgetEntry(date: Date(), snapshot: WidgetSnapshotReader.load())
        let nextRefresh = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date().addingTimeInterval(3600)
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
}

struct OptiScheduleWidgetView: View {
    let entry: OptiScheduleWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let snapshot = entry.snapshot {
                Text(snapshot.businessName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                if !snapshot.authed, let signedOut = snapshot.signedOut {
                    widgetLink(url: signedOut.deepLinkUrl) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(signedOut.title).font(.headline)
                            Text(signedOut.subtitle).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                } else {
                    if let next = snapshot.nextAppointment {
                        widgetLink(url: next.deepLinkUrl) {
                            sectionView(next)
                        }
                    }
                    if let rebook = snapshot.quickRebook {
                        widgetLink(url: rebook.deepLinkUrl) {
                            sectionView(rebook)
                        }
                    }
                    if snapshot.nextAppointment == nil && snapshot.quickRebook == nil {
                        Text("No upcoming visits")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                Text("Open OptiSchedule and sign in to see appointments.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding()
    }

    @ViewBuilder
    private func sectionView(_ section: WidgetSnapshotSection) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(section.title).font(.caption).foregroundStyle(.secondary)
            Text(section.serviceName).font(.headline).lineLimit(1)
            Text(section.subtitle).font(.subheadline).foregroundStyle(.secondary).lineLimit(2)
        }
        .padding(.vertical, 2)
    }

    @ViewBuilder
    private func widgetLink<Content: View>(url: String, @ViewBuilder content: () -> Content) -> some View {
        if let link = URL(string: url) {
            Link(destination: link, label: content)
        } else {
            content()
        }
    }
}

@main
struct OptiScheduleWidgetBundle: WidgetBundle {
    var body: some Widget {
        OptiScheduleWidget()
    }
}

struct OptiScheduleWidget: Widget {
    let kind = "OptiScheduleWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: OptiScheduleWidgetProvider()) { entry in
            if #available(iOS 17.0, *) {
                OptiScheduleWidgetView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                OptiScheduleWidgetView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("OptiSchedule")
        .description("Next appointment and quick rebook.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
