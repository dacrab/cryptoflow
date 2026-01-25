import { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { Button } from '../components/ui';

const NotFound: Component = () => {
  return (
    <div class="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div class="text-center max-w-md">
        {/* Animated 404 graphic */}
        <div class="relative mb-8">
          {/* Background glow */}
          <div class="absolute inset-0 blur-3xl opacity-20">
            <div class="w-48 h-48 mx-auto bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full" />
          </div>
          
          {/* 404 number with chart line through it */}
          <div class="relative">
            <svg viewBox="0 0 200 100" class="w-64 h-32 mx-auto">
              {/* Grid lines */}
              <g stroke="white" stroke-opacity="0.03">
                <line x1="0" y1="25" x2="200" y2="25" />
                <line x1="0" y1="50" x2="200" y2="50" />
                <line x1="0" y1="75" x2="200" y2="75" />
              </g>
              
              {/* Downward chart line */}
              <defs>
                <linearGradient id="crash-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M0,30 Q30,25 50,35 T100,50 T150,70 T200,85" 
                fill="none" 
                stroke="#ef4444" 
                stroke-width="2" 
                stroke-linecap="round"
                class="animate-pulse"
              />
              <path 
                d="M0,30 Q30,25 50,35 T100,50 T150,70 T200,85 L200,100 L0,100 Z" 
                fill="url(#crash-gradient)" 
              />
              
              {/* 404 text */}
              <text x="100" y="60" text-anchor="middle" class="fill-white text-4xl font-bold" style="font-size: 36px; font-family: ui-monospace, monospace;">
                404
              </text>
            </svg>
          </div>
        </div>

        {/* Icon */}
        <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center">
          <svg class="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </div>

        {/* Text content */}
        <h1 class="text-2xl font-semibold text-white mb-2">Page Not Found</h1>
        <p class="text-zinc-500 mb-8 leading-relaxed">
          Looks like this page took a bearish turn and crashed. 
          The asset you're looking for doesn't exist or has been delisted.
        </p>

        {/* Stats-like display */}
        <div class="grid grid-cols-3 gap-3 mb-8">
          <div class="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <div class="text-[10px] text-zinc-600 uppercase mb-1">Status</div>
            <div class="text-sm font-mono text-red-400">404</div>
          </div>
          <div class="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <div class="text-[10px] text-zinc-600 uppercase mb-1">Page</div>
            <div class="text-sm font-mono text-zinc-400">Lost</div>
          </div>
          <div class="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <div class="text-[10px] text-zinc-600 uppercase mb-1">Action</div>
            <div class="text-sm font-mono text-emerald-400">HODL</div>
          </div>
        </div>

        {/* Action buttons */}
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <A href="/">
            <Button variant="primary" class="w-full sm:w-auto">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Back to Dashboard
            </Button>
          </A>
          <Button variant="ghost" onClick={() => window.history.back()}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Go Back
          </Button>
        </div>

        {/* Footer hint */}
        <p class="mt-12 text-xs text-zinc-700">
          Pro tip: Use the search bar to find your favorite coins
        </p>
      </div>
    </div>
  );
};

export default NotFound;
