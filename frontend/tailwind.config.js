module.exports = {
  content: ['./src/**/*.{js,jsx}','./public/index.html'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT:'#0d1b2a', 700:'#1a2b4a', 600:'#243b6a', 500:'#2e4d8a' },
        gold:  { DEFAULT:'#c9a84c', light:'#e8c96a', dark:'#a07830' },
        teal:  { DEFAULT:'#0b7285', light:'#15aabf' },
      },
      fontFamily: {
        display: ['"Playfair Display"','Georgia','serif'],
        body:    ['"DM Sans"','system-ui','sans-serif'],
      },
      backgroundImage: {
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in': 'slideIn 0.4s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeUp:  { from:{opacity:'0',transform:'translateY(20px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        fadeIn:  { from:{opacity:'0'}, to:{opacity:'1'} },
        slideIn: { from:{opacity:'0',transform:'translateX(-20px)'}, to:{opacity:'1',transform:'translateX(0)'} },
      },
    },
  },
  plugins: [],
};
