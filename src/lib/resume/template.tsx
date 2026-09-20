import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import { Profile } from "@/lib/schema/profile";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1c1b1a",
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  headline: {
    fontSize: 11,
    color: "#4a4540",
    marginTop: 2,
  },
  contactRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    fontSize: 9,
    color: "#4a4540",
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#dedad2",
    paddingBottom: 3,
    marginBottom: 6,
  },
  entry: {
    marginBottom: 8,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entryTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  entryDates: {
    fontSize: 9,
    color: "#6b6660",
  },
  entrySubtitle: {
    fontSize: 9.5,
    color: "#4a4540",
    marginBottom: 2,
  },
  bullet: {
    flexDirection: "row",
    marginTop: 1.5,
  },
  bulletDot: {
    width: 10,
    fontSize: 9.5,
  },
  bulletText: {
    fontSize: 9.5,
    flex: 1,
    lineHeight: 1.35,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillChip: {
    fontSize: 9,
    backgroundColor: "#e9d9c8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
});

function formatRange(start: string, end: string | null) {
  return `${start} — ${end ?? "present"}`;
}

export function ResumeDocument({ profile }: { profile: Profile }) {
  return (
    <Document title={`${profile.name} — Resume`}>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{profile.name || "Your name"}</Text>
          {profile.headline && <Text style={styles.headline}>{profile.headline}</Text>}
          <View style={styles.contactRow}>
            {profile.email && <Text>{profile.email}</Text>}
            {profile.location && <Text>{profile.location}</Text>}
            {profile.links.map((l) => (
              <Link key={l.url} src={l.url} style={{ color: "#b5622a" }}>
                {l.label}
              </Link>
            ))}
          </View>
        </View>

        {profile.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={{ fontSize: 9.5, lineHeight: 1.4 }}>{profile.summary}</Text>
          </View>
        )}

        {profile.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {profile.experience.map((e) => (
              <View key={e.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>
                    {e.role} · {e.org}
                  </Text>
                  <Text style={styles.entryDates}>
                    {formatRange(e.start_date, e.end_date)}
                  </Text>
                </View>
                {e.bullets.map((b, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {profile.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {profile.projects.map((p) => (
              <View key={p.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>{p.name}</Text>
                </View>
                {p.description && (
                  <Text style={styles.entrySubtitle}>{p.description}</Text>
                )}
                {[...p.bullets, ...p.metrics].map((b, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {profile.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {profile.education.map((ed) => (
              <View key={ed.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>
                    {ed.institution}
                    {ed.degree ? ` · ${ed.degree}` : ""}
                  </Text>
                  <Text style={styles.entryDates}>
                    {formatRange(ed.start_date, ed.end_date)}
                  </Text>
                </View>
                {ed.notes && <Text style={styles.entrySubtitle}>{ed.notes}</Text>}
              </View>
            ))}
          </View>
        )}

        {profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {profile.skills.map((s) => (
                <Text key={s.id} style={styles.skillChip}>
                  {s.name}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
