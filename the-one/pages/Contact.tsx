
import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="w-full bg-white">
      <section className="relative pt-24 pb-16 border-b border-neutral-100 max-w-7xl mx-auto px-6">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter text-black uppercase leading-none">
            About Us
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 max-w-2xl leading-relaxed font-medium">
            Forging elite fitness online. We are an advanced digital training platform dedicated to helping you achieve your specific athletic targets, no matter where you train.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-7 space-y-12">
          <h2 className="text-3xl font-black font-display uppercase tracking-tight text-black">Our Mission</h2>
          <div className="space-y-6 text-lg text-neutral-600 font-medium leading-relaxed">
            <p>
              We are not a traditional gym; we are a premier online training company. Our mission is to democratize access to elite-level coaching, allowing everyday athletes to master their chosen sport—whether it's weightlifting, functional fitness, or general athleticism—from anywhere in the world.
            </p>
            <p>
              Our coaching staff consists of industry leaders known across Iraq for their highly effective training methodologies. They bring decades of combined experience, having competed at the highest levels and mentored hundreds of athletes from beginners to professionals remotely.
            </p>
            <p>
              We have had the honor of training players from <span className="font-black text-black">Iraqi National Teams</span>, preparing them for international competition. Our programs are designed to build resilience, power, and the mental fortitude required to win, delivered directly to your device.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-10">
            {[
              { icon: 'laptop_mac', label: 'Remote Coaching', text: 'Expert programming delivered digitally, tailored to your environment.' },
              { icon: 'groups', label: 'National Impact', text: 'Trusted by Iraqi National Team athletes for strength and conditioning.' },
              { icon: 'fitness_center', label: 'Sport Specific', text: 'Targeted cycles for your specific discipline and performance goals.' },
            ].map(item => (
              <div key={item.label} className="flex gap-6 items-start">
                <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-neutral-100">
                  <span className="material-symbols-outlined text-black">{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-black text-lg font-display uppercase tracking-tight">{item.label}</h3>
                  <p className="mt-1 text-neutral-500 font-medium leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <span className="material-symbols-outlined text-6xl text-neutral-300">verified</span>
          <h2 className="text-4xl font-black font-display uppercase tracking-tight max-w-2xl mx-auto">
            "We don't just write workouts; we engineer your path to victory."
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
             <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-neutral-100">
                <p className="text-4xl font-black text-black mb-2">100%</p>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Online Focus</p>
             </div>
             <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-neutral-100">
                <p className="text-4xl font-black text-black mb-2">500+</p>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Athletes Guided</p>
             </div>
             <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-neutral-100">
                <p className="text-4xl font-black text-black mb-2">Elite</p>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Methods</p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
