"use client";

import { useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";

export default function HomePage() {
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    elementsRef.current.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative min-h-screen bg-neutral-950 overflow-hidden">
      {/* 3D CSS effect */}
      <div className="absolute inset-0 perspective-1000">
        <div className="relative h-full w-full transform-style-3d">
          <div className="absolute inset-0 bg-[url('/car-bg.jpg')] bg-cover bg-center transform translate-z-[-100px] scale-1.2" />
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-3xl transform translate-z-[-50px]" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 py-12 sm:py-24">
        {/* Main title */}
        <div
          ref={el => { elementsRef.current[0] = el }}
          className="fade-in text-center mb-8 sm:mb-16 transition-opacity duration-300 ease-out opacity-0 visible:opacity-100"
        >
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent mb-4">
            Élégance
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl text-neutral-400">
            L&apos;excellence du transport privé
          </h2>
        </div>

        {/* How it works section */}
        <div
          ref={el => { elementsRef.current[1] = el }}
          className="fade-in w-full max-w-7xl mt-8 sm:mt-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-100 mb-6 sm:mb-8 text-center">
            Comment ça marche ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 text-neutral-100 gap-6 sm:gap-8 px-4">
            {[
              {
                title: "1. Simulez le prix",
                description: "Saisissez les adresses de départ et d'arrivée pour obtenir un devis instantané.",
              },
              {
                title: "2. Commandez",
                description: "Entrez vos informations et confirmez la réservation. Nous bloquons immédiatement l'horaire de votre chauffeur.",
              },
              {
                title: "3. Réservation garantie",
                description: "Votre chauffeur est confirmé. Vous recevrez ses coordonnées avant le départ.",
              }
            ].map((step, index) => (
              <div key={index}>
                <Card className="h-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Main CTA */}
        <div
          ref={el => { elementsRef.current[2] = el }}
          className="fade-in mt-8 sm:mt-16"
        >
          <Button
            size="lg"
            className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out transform hover:scale-105"
            onClick={() => window.location.href = "/reservation"}
          >
            Réserver maintenant
          </Button>
        </div>

        {/* Vehicles section */}
        <div
          ref={el => { elementsRef.current[3] = el }}
          className="fade-in w-full max-w-5xl mx-auto px-4 mt-16 sm:mt-32"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-100 mb-6 sm:mb-8 text-center">
            Nos véhicules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 text-neutral-100 gap-6 sm:gap-8">
            {[
              {
                title: "Berline Premium",
                description: "Mercedes Classe E - Jusqu'à 4 passagers - 3 bagages - Confort optimal",
              },
              {
                title: "Van de Luxe",
                description: "Mercedes Classe V - Jusqu'à 7 passagers - 7 bagages - Idéal pour les groupes",
              }
            ].map((vehicle, index) => (
              <div key={index}>
                <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle>{vehicle.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {vehicle.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Become a driver CTA */}
        <div
          ref={el => { elementsRef.current[4] = el }}
          className="fade-in mt-16 sm:mt-32 mb-12"
        >
          <Button
            size="lg"
            className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out transform hover:scale-105"
            onClick={() => window.location.href = "/contact"}
          >
            Devenir chauffeur
          </Button>
        </div>
      </div>
    </main>
  );
}