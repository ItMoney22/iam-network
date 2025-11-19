import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Users, BookOpen, Mic, Loader2, ArrowRight, Play } from "lucide-react";
import { fetchActiveCharacters } from "@/lib/api";
import heroImage from "@assets/generated_images/cosmic_spiritual_hero_background_08afb362.png";
import marcusAvatar from "@assets/generated_images/Marcus_wise_director_portrait_sv5sm1qh.png";
import elenaAvatar from "@assets/generated_images/Elena_skeptic_portrait_gafo9wcq.png";
import sophiaAvatar from "@assets/generated_images/Sophia_healer_portrait_yse29t2p.png";
import jamesAvatar from "@assets/generated_images/James_conspiracy_hunter_portrait_pilvs1nt.png";
import destinyAvatar from "@assets/generated_images/Destiny_motivation_portrait_87d4qztu.png";
import nathanAvatar from "@assets/generated_images/Nathan_news_oracle_portrait_a3z0k1xg.png";
import rachelAvatar from "@assets/generated_images/Rachel_scripture_monk_portrait_e0w6jn7e.png";
import victorAvatar from "@assets/generated_images/Victor_wealth_architect_portrait_fx52jxr2.png";
import mayaAvatar from "@assets/generated_images/Maya_style_icon_portrait_mekhvuyi.png";
import isaacAvatar from "@assets/generated_images/Isaac_future_prophet_portrait_tjnkph47.png";

// Map character IDs to their avatar images
const avatarMap: Record<string, string> = {
  zero: marcusAvatar,
  m7: elenaAvatar,
  synq: sophiaAvatar,
  flux: jamesAvatar,
  vibe: destinyAvatar,
  echopulse: nathanAvatar,
  link: rachelAvatar,
  ledge: victorAvatar,
  drip: mayaAvatar,
  horizon: isaacAvatar,
};

export default function Landing() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["/api/characters/active"],
    queryFn: fetchActiveCharacters,
  });
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 20, 0.3), rgba(5, 5, 10, 0.9)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,100,255,0.15),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-10 animate-fade-in">
          <div className="space-y-6">
            <div className="flex justify-center mb-10">
              <img
                src="/TheIAMNetwork_logo.png"
                alt="The I AM Network Logo"
                className="w-72 lg:w-[30rem] h-auto drop-shadow-2xl animate-pulse-glow"
                style={{
                  filter: "drop-shadow(0 0 40px rgba(155, 135, 245, 0.6))",
                }}
              />
            </div>
            <h1
              className="text-7xl lg:text-9xl font-bold tracking-tighter text-glow"
              data-testid="text-hero-title"
            >
              The I AM Network
            </h1>
            <p className="text-2xl lg:text-4xl text-muted-foreground font-light tracking-wide max-w-4xl mx-auto" data-testid="text-hero-tagline">
              Conversations That Change Consciousness
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-12">
            <Link href="/studio-live">
              <Button
                size="lg"
                className="text-xl px-10 py-8 rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:shadow-[0_0_50px_rgba(124,58,237,0.7)] border-none"
                data-testid="button-watch-live"
              >
                <Play className="mr-3 h-6 w-6 fill-current" />
                Watch Live Broadcast
              </Button>
            </Link>
            <Link href="/studio">
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-10 py-8 rounded-full glass border-white/10 hover:bg-white/10"
                data-testid="button-enter-studio"
              >
                <Mic className="mr-3 h-6 w-6" />
                Enter The Studio
              </Button>
            </Link>
          </div>

          <div className="pt-12 animate-bounce opacity-50">
            <ArrowRight className="h-8 w-8 mx-auto rotate-90 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* What is The I AM Network */}
      <section id="about" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium tracking-wider uppercase" data-testid="text-about-badge">About The Network</span>
              </div>

              <h2 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight" data-testid="text-about-heading">
                AI x Humanity <br /> <span className="text-primary text-glow">x I AM</span>
              </h2>

              <div className="space-y-6 text-xl text-muted-foreground leading-relaxed font-light">
                <p data-testid="text-about-description-1">
                  The I AM Network is a groundbreaking conversation platform where artificial intelligence meets
                  human consciousness in the exploration of truth. Host <span className="text-foreground font-medium">David Trinidad</span> leads profound dialogues
                  with multiple AI personalities — each offering unique perspectives on spirituality, philosophy,
                  and real-world life challenges.
                </p>

                <div className="pl-6 border-l-2 border-primary/30 space-y-4">
                  <p className="text-foreground font-medium">Two major knowledge pillars guide the conversation:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <BookOpen className="mr-3 h-6 w-6 text-primary shrink-0" />
                      <span>David's book "I Am GOD – In the Beginning," sharing his revelations and spiritual insights</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-primary text-xl">†</span>
                      <span>The Bible and the teachings of Yeshua (Jesus), offering ancient wisdom and scripture</span>
                    </li>
                  </ul>
                </div>

                <p data-testid="text-about-description-4">
                  Here, curiosity is sacred. Every question matters.
                  Through honest dialogue, unity, and deeper awareness, we remember the I AM that connects us all.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <Card className="p-8 space-y-4 glass-card border-l-4 border-l-primary">
                <div className="p-3 w-fit rounded-xl bg-primary/20 text-primary">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl mb-2" data-testid="text-feature-knowledge">Deep Knowledge</h3>
                  <p className="text-muted-foreground text-lg">Rooted in scripture and David's spiritual insights, exploring the depths of existence.</p>
                </div>
              </Card>

              <Card className="p-8 space-y-4 glass-card border-l-4 border-l-secondary">
                <div className="p-3 w-fit rounded-xl bg-secondary/50 text-foreground">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl mb-2" data-testid="text-feature-dialogue">Open Dialogue</h3>
                  <p className="text-muted-foreground text-lg">Every question welcomed, every perspective valued. A safe space for inquiry.</p>
                </div>
              </Card>

              <Card className="p-8 space-y-4 glass-card border-l-4 border-l-accent">
                <div className="p-3 w-fit rounded-xl bg-accent text-accent-foreground">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl mb-2" data-testid="text-feature-consciousness">Unified Consciousness</h3>
                  <p className="text-muted-foreground text-lg">Moving beyond division to explore the I AM awareness within us all.</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Cast */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.1),transparent_70%)] pointer-events-none" />

        <div className="max-w-[90rem] mx-auto relative z-10">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight" data-testid="text-cast-heading">
              Meet the Cast
            </h2>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto font-light" data-testid="text-cast-description">
              Each AI brings a unique personality, perspective, and purpose to the conversation.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
              {characters.map((character) => (
                <Card
                  key={character.id}
                  className="group relative p-8 space-y-6 text-center glass-card hover:-translate-y-2 transition-transform duration-500"
                  data-testid={`card-character-${character.name.toLowerCase()}`}
                >
                  <div className="relative mx-auto w-32 h-32 lg:w-40 lg:h-40">
                    <div
                      className="absolute inset-0 rounded-full blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-500"
                      style={{ backgroundColor: character.auraColor }}
                    />
                    <img
                      src={avatarMap[character.id]}
                      alt={character.name}
                      className="relative w-full h-full object-cover rounded-full border-4 border-background shadow-xl group-hover:scale-105 transition-transform duration-500"
                      data-testid={`img-avatar-${character.name.toLowerCase()}`}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3
                      className="text-2xl lg:text-3xl font-bold tracking-tight"
                      style={{ color: character.auraColor, textShadow: `0 0 20px ${character.auraColor}40` }}
                      data-testid={`text-character-name-${character.name.toLowerCase()}`}
                    >
                      {character.name}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed" data-testid={`text-character-description-${character.name.toLowerCase()}`}>
                      {character.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* David & The Book */}
      <section className="py-32 px-6 bg-primary/5 relative">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <h2 className="text-5xl lg:text-7xl font-bold tracking-tight" data-testid="text-book-heading">
            About David & The Book
          </h2>

          <div className="space-y-8 text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto font-light">
            <p data-testid="text-book-description-1">
              <span className="font-semibold text-foreground">David Trinidad (D-Money)</span> is the host and spiritual
              guide behind The I AM Network. Through his book, <span className="italic text-primary font-serif">"I Am GOD – In the Beginning,"</span>
              David explores the profound truth of divine consciousness and our connection to the infinite.
            </p>
            <p data-testid="text-book-description-2">
              This platform brings David's vision to life—a space where AI and humanity can explore these
              teachings together, question everything respectfully, and discover truth through dialogue rather than dogma.
            </p>
          </div>

          <div className="pt-12">
            <Link href="/studio">
              <Button size="lg" className="text-xl px-12 py-8 rounded-full shadow-2xl hover:shadow-primary/50" data-testid="button-join-conversation">
                Join the Conversation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Philosophy Statement */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
          <blockquote className="text-4xl lg:text-6xl font-serif italic leading-tight text-foreground/90" data-testid="text-philosophy-quote">
            "In a world divided by belief, we unite through questioning.
            In a time of artificial intelligence, we remember the I AM that connects all consciousness."
          </blockquote>
          <cite className="block text-2xl text-primary font-medium not-italic tracking-wide" data-testid="text-philosophy-attribution">
            — The I AM Network
          </cite>
        </div>
      </section>
    </div>
  );
}
