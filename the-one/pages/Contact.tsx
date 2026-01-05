
import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="w-full bg-white">
      <section className="relative pt-24 pb-16 border-b border-neutral-100 max-w-7xl mx-auto px-6">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter text-black uppercase leading-none">
            Contact Us
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 max-w-2xl leading-relaxed font-medium">
            Have questions about our programming? Want to drop in for a WOD? We're here to help you crush your fitness goals.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-7 space-y-12">
          <h2 className="text-3xl font-black font-display uppercase tracking-tight text-black">Send a Message</h2>
          <form className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Full Name</label>
                <input type="text" placeholder="Jane Doe" className="h-16 w-full border border-neutral-100 bg-neutral-50 px-6 rounded-2xl font-medium focus:border-black focus:ring-1 focus:ring-black transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Email Address</label>
                <input type="email" placeholder="jane@example.com" className="h-16 w-full border border-neutral-100 bg-neutral-50 px-6 rounded-2xl font-medium focus:border-black focus:ring-1 focus:ring-black transition-all" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Message</label>
              <textarea placeholder="How can we help?" rows={6} className="w-full resize-none border border-neutral-100 bg-neutral-50 p-6 rounded-2xl font-medium focus:border-black focus:ring-1 focus:ring-black transition-all"></textarea>
            </div>
            <button className="h-16 px-12 bg-black text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-neutral-800 shadow-2xl transition-all">
              Send Message
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-10">
            {[
              { icon: 'location_on', label: 'Visit Us', text: '123 Fitness Blvd, Muscle City, CA 90210' },
              { icon: 'call', label: 'Call Us', text: '+1 (555) 019-2834' },
              { icon: 'mail', label: 'Email Us', text: 'hello@crossfittraining.com' },
              { icon: 'schedule', label: 'Opening Hours', text: 'Mon-Fri: 5am - 9pm, Sat-Sun: 7am - 2pm' },
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
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-black font-display uppercase text-center mb-16 tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Do you offer drop-ins?', a: 'Yes! We welcome visitors from other boxes. Our drop-in fee is $25 per class, or you can buy a t-shirt for $35 to cover your visit.' },
              { q: 'What is the pricing for courses?', a: 'Pricing varies depending on the frequency of training and course intensity. Check individual course pages for details.' },
              { q: 'Do I need previous experience?', a: 'Not at all. Our coaches scale every workout to your current fitness level. We have beginners starting every week.' },
            ].map((item, idx) => (
              <details key={idx} className="group bg-white border border-neutral-100 rounded-3xl p-8 hover:border-black transition-all cursor-pointer shadow-sm">
                <summary className="flex justify-between items-center list-none font-bold text-lg font-display uppercase tracking-tight">
                  {item.q}
                  <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="mt-6 text-neutral-500 font-medium leading-loose border-t border-neutral-50 pt-6">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
