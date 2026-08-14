import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Logo } from '../components/Logo';
import { motion } from 'motion/react';

export default function Landing() {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#9b9b9b] to-[#f5f5f5] text-black flex flex-col font-sans overflow-hidden relative">
      <header className="py-6 px-8 flex justify-between items-center z-20 relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-transparent p-2"
        >
           <Logo className="h-10 md:h-12 mix-blend-multiply" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link to="/login" className="inline-flex h-10 px-4 py-2 shrink-0 items-center justify-center rounded-lg border bg-transparent border-black text-black hover:bg-black hover:text-white text-sm font-medium transition-all duration-300">
            Sign In
          </Link>
        </motion.div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10 -mt-10 md:-mt-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-8 mt-12 md:mt-16"
        >
          <Logo className="h-64 md:h-80 lg:h-[450px] object-contain mix-blend-multiply" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 text-black uppercase"
        >
          Studio Management,<br />Perfected.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-lg md:text-xl text-gray-800 max-w-2xl mx-auto mb-10 font-medium"
        >
          Professional invoice and billing platform tailored for modern film studios. 
          Elevate your workflow with AI-powered extraction and sleek elegance.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Link to="/login" className="inline-flex shrink-0 items-center justify-center font-medium h-14 px-10 text-lg bg-black text-white hover:bg-gray-800 rounded-full shadow-2xl hover:shadow-black/20 transition-all duration-300 transform hover:-translate-y-1">
            Enter Platform
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </motion.div>
        
      </main>
      
      <footer className="py-8 text-center text-gray-800 font-medium mt-16 relative z-10">
        <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
        <p>© {new Date().getFullYear()} JenG Film Studio. All rights reserved.</p>
      </footer>
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/20 blur-3xl mix-blend-overlay"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-black/5 blur-3xl mix-blend-overlay"></div>
      </div>
    </div>
  );
}
