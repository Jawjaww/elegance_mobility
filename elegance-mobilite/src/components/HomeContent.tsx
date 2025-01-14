"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function HomeContent() {
  return (
    <main className="relative min-h-screen bg-neutral-950 overflow-hidden">
      {/* 3D CSS effect */}
      <div className="absolute inset-0 perspective-1000">
        <div className="relative h-full w-full transform-style-3d">
          {/* Background layer */}
          <div className="absolute inset-0 bg-[url('/car-bg.jpg')] bg-cover bg-center transform translate-z-[-100px] scale-1.2" />
          
          {/* Glass layer */}
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-3xl transform translate-z-[-50px]" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8">
        {/* Main title with 3D effect */}
        <motion.div
          className="text-center mb-16 perspective-1000"
          initial={{ opacity: 0, rotateX: 90 }}
          animate={{ opacity: 1, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent mb-4 transform-style-3d">
            <span className="inline-block transform rotate-x-12">Élégance</span>
          </h1>
          <h2 className="text-2xl md:text-3xl text-neutral-400 transform translate-y-4">
            Redefining premium transportation
          </h2>
        </motion.div>

        {/* How it works section */}
        <motion.div
          className="w-full max-w-7xl mt-16 perspective-1000"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-8 transform translate-z-20">
            How does it work?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="transform-style-3d"
              whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800 h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-100">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    <CardTitle className="text-xl text-neutral-100">1. Simulate the price</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400">
                    Enter the pickup and destination addresses to get an instant quote.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="transform-style-3d"
              whileHover={{ rotateY: -5, rotateX: 5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800 h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-100">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      <path d="M15 3h6v6"/>
                    </svg>
                    <CardTitle className="text-xl text-neutral-100">2. Order</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400">
                    Enter your information and confirm the reservation. We immediately block your driver's schedule.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="transform-style-3d"
              whileHover={{ rotateY: 5, rotateX: 5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800 h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-100">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <CardTitle className="text-xl text-neutral-100">3. Guaranteed reservation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400">
                    Your driver is confirmed. You will receive their contact details before pickup.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Services section with 3D card effect */}
        <motion.div
          className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 perspective-1000 mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.div
            className="transform-style-3d"
            whileHover={{ rotateY: 10, rotateX: -5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
              <CardHeader>
                <CardTitle className="text-2xl text-neutral-100">Punctuality</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-neutral-400">
                  Always on time, every time
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="transform-style-3d"
            whileHover={{ rotateY: -10, rotateX: 5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
              <CardHeader>
                <CardTitle className="text-2xl text-neutral-100">Comfort</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-neutral-400">
                  Luxury vehicles, premium experience
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="transform-style-3d"
            whileHover={{ rotateY: 10, rotateX: 5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
              <CardHeader>
                <CardTitle className="text-2xl text-neutral-100">Discretion</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-neutral-400">
                  Professional and discreet service
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main CTA with depth effect */}
        <motion.div
          className="mt-16 perspective-1000"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotateY: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Button
              size="lg"
              className="bg-neutral-100 text-neutral-950 hover:bg-neutral-300 transition-colors transform-style-3d"
              onClick={() => window.location.href = "/reservation"}
            >
              Book now
            </Button>
          </motion.div>
        </motion.div>

        {/* Our commitments section */}
        <motion.div
          className="w-full max-w-7xl mt-32 perspective-1000"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-8 transform translate-z-20">
            Our commitments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="transform-style-3d"
              whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-100">Guaranteed reservation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400">
                    Your driver is reserved upon confirmation. Schedule blocked up to 1 year in advance.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="transform-style-3d"
              whileHover={{ rotateY: -5, rotateX: 5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-100">Flight/Train tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400">
                    We track your arrival in real-time. 1 hour of waiting time offered at the airport.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="transform-style-3d"
              whileHover={{ rotateY: 5, rotateX: 5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-100">Fixed rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400">
                    No surprises. The quoted price is what you pay, even in case of traffic.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Our vehicles section */}
        <motion.div
          className="w-full max-w-7xl mt-32 perspective-1000"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-8 transform translate-z-20">
            Our vehicles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              className="transform-style-3d"
              whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-100">Premium Sedan</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400">
                    Mercedes E-Class - Up to 4 passengers - 3 bags - Optimal comfort
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="transform-style-3d"
              whileHover={{ rotateY: -5, rotateX: 5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-100">Luxury Van</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400">
                    Mercedes V-Class - Up to 7 passengers - 7 bags - Ideal for groups
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced testimonials section */}
        <motion.div
          className="w-full max-w-7xl mt-32 perspective-1000"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-8 transform translate-z-20">
            What our clients say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="transform-style-3d"
              whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-100">Exemplary punctuality</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400">
                    "The Mercedes E-Class was perfect for my business meeting. Very professional driver."
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}