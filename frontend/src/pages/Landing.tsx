import React from 'react';
import { ArrowRight, Play, Zap, Users, Factory, Leaf, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex-grow flex flex-col pt-10 pb-20 overflow-hidden relative">
      
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-green-50 to-transparent rounded-full -z-10 translate-x-1/3 -translate-y-1/4 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-green-50 to-transparent rounded-full -z-10 -translate-x-1/4 translate-y-1/4 blur-3xl"></div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row items-center gap-12 max-w-7xl mx-auto w-full px-6">
        
        {/* Left Copy */}
        <div className="flex-1 space-y-8 z-10 w-full max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-primary text-sm font-medium border border-green-100">
            <Leaf className="w-4 h-4" /> Clean Energy. Shared Future.
          </div>
          
          <h1 className="font-Display text-5xl md:text-6xl font-bold leading-tight text-[#1E293B]">
            Power to the people.<br/>
            <span className="text-primary">Trade. Save. Sustain.</span>
          </h1>
          
          <p className="text-gray-500 text-lg leading-relaxed">
            Join our P2P energy marketplace and buy or sell clean energy directly with others in your community. Affordable. Transparent. Empowering.
          </p>
          
          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary flex items-center gap-2 py-3 px-8 text-lg"
            >
              Explore Marketplace <ArrowRight className="w-5 h-5" />
            </button>
            <button className="btn-outline py-3 px-8 text-lg">
              <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
                <Play className="w-3 h-3 text-gray-700 ml-0.5" fill="currentColor" />
              </span>
              How It Works
            </button>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <img key={i} className="w-10 h-10 rounded-full border-2 border-white object-cover" src={`https://i.pravatar.cc/100?img=${i+10}`} alt={`User ${i}`} />
              ))}
            </div>
            <div className="text-sm text-gray-500">
              Join <span className="font-semibold text-primary">10,000+</span> users building<br/>a sustainable future
            </div>
          </div>
        </div>

        {/* Right Graphic */}
        <div className="flex-1 relative w-full h-[600px] hidden md:block">
          <img 
            src="/hero-isometric.png" 
            alt="Smart Homes Grid" 
            className="w-full h-full object-contain drop-shadow-xl"
          />
          
          {/* Floating CSS Tags mirroring the design */}
          <div className="absolute top-24 left-10 bg-white rounded-xl shadow-lg p-3 w-32 border border-gray-100 animate-bounce" style={{animationDuration: '4s'}}>
            <div className="text-xs text-primary font-semibold mb-1">Selling</div>
            <div className="font-bold text-gray-800">3.8 kWh</div>
            <div className="text-primary font-bold text-sm">$1.20 <span className="text-xs font-normal text-gray-500">/kWh</span></div>
          </div>

          <div className="absolute bottom-40 left-10 bg-white rounded-xl shadow-lg p-3 w-32 border border-gray-100 animate-bounce" style={{animationDuration: '5s', animationDelay: '1s'}}>
            <div className="text-xs text-[#008CC8] font-semibold mb-1">Buying</div>
            <div className="font-bold text-gray-800">2.6 kWh</div>
            <div className="text-[#008CC8] font-bold text-sm">$1.45 <span className="text-xs font-normal text-gray-500">/kWh</span></div>
          </div>

          <div className="absolute top-10 right-10 bg-white rounded-xl shadow-lg p-3 w-32 border border-gray-100 animate-bounce" style={{animationDuration: '6s', animationDelay: '2s'}}>
            <div className="text-xs text-primary font-semibold mb-1">Selling</div>
            <div className="font-bold text-gray-800">5.2 kWh</div>
            <div className="text-primary font-bold text-sm">$1.35 <span className="text-xs font-normal text-gray-500">/kWh</span></div>
          </div>

          <div className="absolute bottom-20 right-5 bg-white rounded-xl shadow-lg p-3 w-32 border border-gray-100 animate-bounce" style={{animationDuration: '4.5s', animationDelay: '0.5s'}}>
            <div className="text-xs text-[#008CC8] font-semibold mb-1">Buying</div>
            <div className="font-bold text-gray-800">4.1 kWh</div>
            <div className="text-[#008CC8] font-bold text-sm">$1.40 <span className="text-xs font-normal text-gray-500">/kWh</span></div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Section */}
      <div className="max-w-7xl mx-auto w-full px-6 mt-12 bg-white rounded-[2.5rem] shadow-soft border border-gray-50 p-8 flex flex-wrap justify-between items-center gap-8 relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">1.2 GWh+</div>
            <div className="text-sm text-gray-500 font-medium">Energy Traded</div>
          </div>
        </div>

        <div className="hidden md:block w-px h-12 bg-gray-100"></div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">10,000+</div>
            <div className="text-sm text-gray-500 font-medium">Active Users</div>
          </div>
        </div>

        <div className="hidden md:block w-px h-12 bg-gray-100"></div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
            <Factory className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">2,500+</div>
            <div className="text-sm text-gray-500 font-medium">Energy Producers</div>
          </div>
        </div>

        <div className="hidden md:block w-px h-12 bg-gray-100"></div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">1,850 Tons</div>
            <div className="text-sm text-gray-500 font-medium">CO₂ Saved</div>
          </div>
        </div>

        <div className="hidden md:block w-px h-12 bg-gray-100"></div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">$250K+</div>
            <div className="text-sm text-gray-500 font-medium">Savings Generated</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Landing;
