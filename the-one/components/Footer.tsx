
import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  logo?: string;
}

const Footer: React.FC<FooterProps> = ({ logo }) => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row justify-between gap-12">
        <div className="flex flex-col gap-6 lg:max-w-md">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[16px]">fitness_center</span>
              </div>
            )}
            <span className="text-base font-bold tracking-tight text-black font-display">CrossFit Training</span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            Elevating the standard of fitness coaching worldwide. Join our community of dedicated athletes and trainers.
          </p>
          <p className="text-gray-400 text-xs mt-4">
            © 2024 CrossFit Training. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap gap-12 lg:gap-24">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-black">Company</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-500">
              <li><Link to="/about" className="hover:text-black transition-colors">About Us</Link></li>
              <li><Link to="/coaches" className="hover:text-black transition-colors">Coaches</Link></li>
              <li><Link to="/contact" className="hover:text-black transition-colors">Careers</Link></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-black">Resources</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-500">
              <li><Link to="/courses" className="hover:text-black transition-colors">Courses</Link></li>
              <li><Link to="/profile/nutrition" className="hover:text-black transition-colors">Meal Plans</Link></li>
              <li><Link to="/contact" className="hover:text-black transition-colors">Help Center</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
