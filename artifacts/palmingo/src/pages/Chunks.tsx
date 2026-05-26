import { motion } from "framer-motion";
import { Link } from "wouter";
import { Briefcase, Plane, Coffee, GraduationCap, ArrowRight } from "lucide-react";

const topics = [
  { title: "Business English", desc: "Meetings, emails, negotiation.", lessons: 12, icon: Briefcase, accent: "from-[oklch(0.65_0.2_250)] to-[oklch(0.55_0.22_280)]", scenario: "Job interview" },
  { title: "Travel", desc: "Airports, hotels, directions.", lessons: 9, icon: Plane, accent: "from-[oklch(0.75_0.2_180)] to-[oklch(0.65_0.22_210)]", scenario: "Travel & airport" },
  { title: "Daily Conversation", desc: "Small talk, ordering, family.", lessons: 15, icon: Coffee, accent: "from-[oklch(0.75_0.18_60)] to-[oklch(0.65_0.22_30)]", scenario: "Ordering at a cafe" },
  { title: "Academic", desc: "Essays, presentations, research.", lessons: 8, icon: GraduationCap, accent: "from-[oklch(0.7_0.22_320)] to-[oklch(0.6_0.25_290)]", scenario: "Debate practice" },
];

export default function Chunks() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Topic Chunks</h1>
        <p className="text-muted-foreground text-sm mt-1">Bite-sized lessons, grouped by what you need.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {topics.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              data-testid={`card-topic-${t.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Link
                to={`/tutor?scenario=${encodeURIComponent(t.scenario)}`}
                className="glass rounded-3xl p-6 block group hover:scale-[1.015] transition"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.accent} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-lg font-display font-semibold">{t.title}</div>
                    <div className="text-sm text-muted-foreground">{t.desc}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{t.lessons} lessons</div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-gradient font-medium">
                  Start chunk <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="glass rounded-3xl p-6 text-center">
        <p className="text-sm text-muted-foreground">Each topic opens a focused AI tutor session with vocabulary and scenarios tailored to the theme.</p>
        <Link to="/tutor" className="inline-flex mt-4 gradient-primary text-white px-5 py-2.5 rounded-2xl text-sm font-medium items-center gap-2">
          Open AI Tutor <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
