import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Brain,
  Layers,
  Flame,
  CheckCircle2,
  BookOpen,
  Keyboard,
  ListChecks,
  Shuffle,
  Volume2,
} from 'lucide-react';
import { STRINGS } from '@/lib/constants/strings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <Badge variant="brand" className="px-3.5 py-1 text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" />
                Adaptive Vocabulary Mastery
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Learn English words{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">
                  you will never forget.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                {STRINGS.heroSubtitle}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto shadow-md shadow-brand-500/25">
                    <span>{STRINGS.cta.primaryButton}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    {STRINGS.nav.login}
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success-600" />
                  <span>SM-2 Spaced Repetition</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success-600" />
                  <span>100% Free Core Learning</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success-600" />
                  <span>Custom Personal Words</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual / Interactive Card Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Decorative glow */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-500 to-indigo-400 opacity-20 blur-xl"></div>
                
                {/* Simulated Study Card */}
                <div className="relative bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
                  {/* Card Header / Metas */}
                  <div className="flex items-center justify-between">
                    <Badge variant="brand">Verb • A2 / B1</Badge>
                    <span className="text-xs font-semibold text-slate-400">SM-2 Card #1</span>
                  </div>

                  {/* Word Headword & Pronunciation */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        accomplish
                      </h2>
                      <button
                        type="button"
                        aria-label="Audio pronunciation preview"
                        className="p-2 rounded-full text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 font-mono">/əˈkʌm.plɪʃ/</p>
                  </div>

                  {/* Bulgarian Translation Highlight */}
                  <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-100 space-y-1">
                    <span className="text-xs font-medium text-brand-700 uppercase tracking-wider">
                      Bulgarian Translation
                    </span>
                    <p className="text-lg font-bold text-slate-900">
                      постигам, осъществявам
                    </p>
                  </div>

                  {/* Example sentence */}
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-700 italic">
                      &ldquo;She accomplished all her study goals this month.&rdquo;
                    </p>
                    <p className="text-slate-400 text-xs">
                      Тя постигна всичките си учебни цели този месец.
                    </p>
                  </div>

                  {/* SRS Rating Actions Preview */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                      Spaced Repetition Recall
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
                      <div className="p-2 rounded-xl bg-red-50 text-red-700 border border-red-100">
                        Again
                        <span className="block text-[10px] text-red-500 font-normal">10m</span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                        Hard
                        <span className="block text-[10px] text-amber-500 font-normal">1d</span>
                      </div>
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                        Good
                        <span className="block text-[10px] text-blue-500 font-normal">3d</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Easy
                        <span className="block text-[10px] text-emerald-500 font-normal">7d</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <Badge variant="brand">{STRINGS.features.badge}</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {STRINGS.features.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            {STRINGS.features.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STRINGS.features.items.map((item, idx) => {
            const icons = [
              <Brain key="0" className="w-6 h-6 text-brand-600" />,
              <BookOpen key="1" className="w-6 h-6 text-brand-600" />,
              <Layers key="2" className="w-6 h-6 text-brand-600" />,
              <Shuffle key="3" className="w-6 h-6 text-brand-600" />,
              <Flame key="4" className="w-6 h-6 text-brand-600" />,
              <CheckCircle2 key="5" className="w-6 h-6 text-brand-600" />,
            ];

            return (
              <Card key={idx} hover className="flex flex-col justify-between">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-2">
                    {icons[idx % icons.length]}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Study Modes Interactive Showcase */}
      <section id="modes" className="bg-slate-100/70 border-y border-slate-200/80 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {STRINGS.studyModes.title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {STRINGS.studyModes.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900">{STRINGS.studyModes.flashcards.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {STRINGS.studyModes.flashcards.description}
              </p>
            </Card>

            <Card className="text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <ListChecks className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900">{STRINGS.studyModes.quiz.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {STRINGS.studyModes.quiz.description}
              </p>
            </Card>

            <Card className="text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <Keyboard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900">{STRINGS.studyModes.typing.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {STRINGS.studyModes.typing.description}
              </p>
            </Card>

            <Card className="text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <Shuffle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900">{STRINGS.studyModes.matching.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {STRINGS.studyModes.matching.description}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 lg:p-16 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {STRINGS.cta.title}
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              {STRINGS.cta.subtitle}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white">
                  <span>{STRINGS.cta.primaryButton}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

