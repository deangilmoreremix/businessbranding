# AI Brand Creator

A comprehensive AI-powered platform for creating and managing brand identities. Transform your business idea into a complete brand identity using cutting-edge AI technology including brand analysis, visual identity creation, voice content generation, and strategic planning.

![AI Brand Creator](https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80)

## 🚀 Features

### 🧠 AI-Powered Brand Analysis
- **Comprehensive Brand Health Assessment** - 85-point analysis across 20 strategic pillars
- **Market Positioning Analysis** - Competitive benchmarking and market fit evaluation
- **Website & Social Media Scanning** - Automated analysis of existing digital presence
- **Industry Benchmarking** - Compare against top performers in your industry
- **Growth Opportunity Identification** - AI-powered insights for brand improvement
- **Strategic Recommendations** - Actionable insights for brand enhancement

### 🎨 Visual Identity Creation
- **AI Logo Generation** - Create professional logos with Recraft AI
- **Style Transfer** - Transform images between different visual styles
- **Color Palette Extraction** - AI-powered color scheme analysis and generation
- **Brand Asset Creation** - Generate marketing materials and templates
- **Visual Consistency Checking** - Ensure brand consistency across all assets
- **Asset Library Management** - Organize and version control visual assets

### 🎙️ Voice Content Studio
- **Text-to-Speech Generation** - Natural voice synthesis with ElevenLabs
- **Podcast Creation** - Multi-voice podcast generation with conversations
- **Audiobook Production** - Convert text content to professional audiobooks
- **Voice Transcription** - Convert audio content to text with speaker detection
- **Voice Profile Management** - Custom voice profiles for brand consistency
- **Audio Enhancement** - AI-powered audio quality improvement

### 📊 Content Management Dashboard
- **Asset Organization** - Centralized management of all brand assets
- **Performance Analytics** - Track engagement and effectiveness
- **Team Collaboration** - Share assets and collaborate on brand projects
- **Export Options** - Multiple format exports (PDF, Excel, images)
- **Version Control** - Track changes and maintain asset history
- **Search & Filtering** - Advanced asset discovery and organization

### 🏢 Business Intelligence
- **Competitive Analysis** - Track and analyze top competitors
- **Market Research** - Industry trends and opportunity identification
- **Social Media Intelligence** - Cross-platform performance analysis
- **Customer Sentiment Tracking** - Monitor brand perception
- **Geographic Performance** - Regional brand performance analysis

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern utility-first CSS framework
- **Framer Motion** - Advanced animations and transitions
- **Shadcn/ui** - Modern component library
- **Lucide React** - Beautiful icon library
- **React Big Calendar** - Calendar and scheduling components
- **Nivo Charts** - Data visualization components

### AI & APIs
- **Google Gemini 2.5 Flash** - Advanced AI analysis and content generation
- **ElevenLabs** - Voice synthesis and audio processing
- **Recraft AI** - Image generation and style transfer
- **Supabase** - Backend-as-a-Service with real-time database

### Backend & Database
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Edge Functions** - Serverless functions for AI processing
- **Row Level Security (RLS)** - Secure data access patterns
- **Real-time subscriptions** - Live data updates

### Development Tools
- **TypeScript** - Type safety and better developer experience
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Supabase account
- API keys for:
  - Google Gemini API
  - ElevenLabs API  
  - Recraft AI API

### Installation

1. **Clone the repository**
```bash
git clone <your-repository-url>
cd ai-brand-creator
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API Keys
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_ELEVEN_LABS_API_KEY=your_eleven_labs_api_key
NEXT_PUBLIC_RECRAFT_API_KEY=your_recraft_api_key
```

4. **Database Setup**
```bash
# The app will automatically create required tables
# Or manually run the migrations in supabase/migrations/
```

5. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
ai-brand-creator/
├── app/                          # Next.js App Router pages
│   ├── (routes)/                # Route groups
│   ├── api/                     # API routes
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── providers.tsx            # Context providers
├── components/                   # React components
│   ├── ui/                      # Shadcn/ui components
│   ├── auth/                    # Authentication components
│   ├── brand-analysis/          # Brand analysis components
│   ├── voice-interface/         # Voice content components
│   ├── visual-identity-analyzer/ # Visual identity components
│   ├── landing-page.tsx         # Landing page component
│   ├── nav-header.tsx           # Navigation header
│   └── footer.tsx               # Footer component
├── lib/                         # Utility libraries
│   ├── services/                # API service layers
│   │   ├── gemini.ts           # Google Gemini integration
│   │   ├── eleven-labs.ts      # ElevenLabs voice API
│   │   ├── recraft.ts          # Recraft image AI
│   │   └── brand-analyzer.ts   # Brand analysis logic
│   ├── supabase/               # Supabase configuration
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   └── auth.ts                 # Authentication logic
├── supabase/                    # Supabase configuration
│   ├── functions/              # Edge functions
│   └── migrations/             # Database migrations
├── public/                     # Static assets
└── docs/                       # Documentation files
```

## 🎯 Core Components

### Brand Analysis (`/brand-strategy`)
- **BusinessAnalyzer** - Analyzes existing business presence
- **BrandAnalysis** - Comprehensive 20-point brand evaluation
- **CompetitiveAnalysis** - Market positioning and competitor insights
- **BrandPillarBreakdown** - Detailed analysis of brand pillars

### Visual Identity (`/visual-identity`)
- **VisualIdentityAnalyzer** - Comprehensive visual brand analysis
- **ImageTransformation** - AI-powered style transfer and generation
- **ColorAnalysis** - Brand color extraction and harmony evaluation
- **AssetGeneration** - Create logos, patterns, and marketing materials

### Voice Content (`/voice-content`)
- **VoiceInterface** - Main voice content creation interface
- **PodcastStudio** - Multi-voice podcast creation
- **AudiobookCreator** - Text-to-audiobook conversion
- **VoiceTranscription** - Audio-to-text with speaker detection
- **VoiceAnalysis** - Voice content optimization and analysis

### Content Dashboard (`/dashboard`)
- **ContentDashboard** - Centralized asset management
- **AssetLibrary** - Organized storage for all brand assets
- **PerformanceTracking** - Analytics and metrics dashboard
- **TeamCollaboration** - Multi-user asset sharing and management

## 🔌 API Endpoints

### Internal API Routes
```
/api/gemini/analyze          # Gemini AI analysis
/api/voice/generate          # Voice content generation
/api/voice/transcribe        # Audio transcription
/api/scrape                  # Website content extraction
/api/supabase/setup          # Database setup
/api/models                  # Available AI models
```

### Supabase Edge Functions
```
/functions/v1/gemini         # Gemini AI processing
/functions/v1/voice-generator # Voice content generation
/functions/v1/brand-analyzer # Brand analysis processing
/functions/v1/recraft        # Image generation
```

## 🗄️ Database Schema

### Core Tables
- **content_items** - Voice and audio content storage
- **voice_profiles** - Custom voice settings and preferences
- **image_assets** - Generated and uploaded visual assets
- **business_analyzer** - Business analysis results and history

### Key Features
- Row Level Security (RLS) enabled on all tables
- Real-time subscriptions for live updates
- Automated timestamp management
- JSON metadata storage for flexible content attributes

## 🔐 Environment Variables

### Required Variables
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Google Gemini AI (Required)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# ElevenLabs Voice AI (Optional)
NEXT_PUBLIC_ELEVEN_LABS_API_KEY=your_eleven_labs_key

# Recraft Image AI (Optional)
NEXT_PUBLIC_RECRAFT_API_KEY=your_recraft_api_key
```

### Demo Mode
If API keys are not provided, the application automatically runs in demo mode with sample data and responses.

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#3B82F6 to #6366F1)
- **Secondary**: Purple accents (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Font Family**: Inter (system fallbacks included)
- **Headings**: Bold weights with gradient text effects
- **Body**: Regular weight for readability
- **Code**: Monospace fonts for technical content

### Components
- **Cards**: Glass-morphism effects with backdrop blur
- **Buttons**: Gradient backgrounds with hover animations
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React for consistent iconography

## 🚀 Deployment

### Production Deployment
The application is optimized for deployment on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Bolt Hosting** (integrated deployment)

### Build Commands
```bash
# Production build
npm run build

# Start production server
npm start

# Development server
npm run dev
```

### Environment Setup for Production
1. Set up Supabase project in production mode
2. Configure API keys in deployment environment
3. Set up custom domain (optional)
4. Configure analytics and monitoring

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
npm run lint         # Run ESLint
npm run clean        # Clean build cache
```

### Development Guidelines
1. **Component Structure**: Follow atomic design principles
2. **Type Safety**: Use TypeScript for all new code
3. **Styling**: Use Tailwind CSS with custom design system
4. **State Management**: React hooks and context for state
5. **Error Handling**: Implement proper error boundaries
6. **Performance**: Optimize for Core Web Vitals

### Testing
```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📱 Features by Page

### Landing Page (`/`)
- Hero section with animated components
- Feature showcase with parallax effects
- Industry-specific solutions
- Call-to-action sections

### Brand Strategy (`/brand-strategy`)
- Business presence analysis
- 20-point brand evaluation
- Competitive intelligence
- Strategic recommendations

### Visual Identity (`/visual-identity`)
- Image upload and analysis
- AI-powered style transfer
- Color palette generation
- Asset creation and management

### Voice Content (`/voice-content`)
- Text-to-speech generation
- Podcast creation studio
- Audiobook production
- Voice transcription services

### Dashboard (`/dashboard`)
- Asset management interface
- Performance analytics
- Team collaboration tools
- Export and sharing options

### Additional Pages
- `/pricing` - Pricing plans and features
- `/about` - Company information
- `/blog` - Educational content
- `/docs` - Technical documentation
- `/contact` - Support and contact information

## 🤖 AI Integration

### Google Gemini
- **Models**: Gemini 2.5 Flash Pro and Flash Lite
- **Use Cases**: Brand analysis, content generation, competitive research
- **Features**: Multi-modal analysis, real-time insights, strategic planning

### ElevenLabs
- **Features**: Voice synthesis, transcription, voice cloning
- **Models**: Multiple voice options with emotion control
- **Quality**: Professional-grade audio generation

### Recraft AI
- **Features**: Image generation, style transfer, logo creation
- **Styles**: 16+ artistic styles and presets
- **Quality**: High-resolution outputs up to 1024x1024

## 📊 Analytics & Monitoring

### Performance Tracking
- Brand health score monitoring
- User engagement analytics
- Content performance metrics
- System performance monitoring

### Error Handling
- Comprehensive error boundaries
- Graceful fallbacks to demo mode
- User-friendly error messages
- Automatic retry mechanisms

## 🔒 Security

### Data Protection
- Row Level Security (RLS) on all database tables
- API key encryption and secure storage
- User authentication with Supabase Auth
- CORS protection for API endpoints

### Privacy
- No sensitive data logging
- User data anonymization options
- GDPR compliance features
- Secure asset storage

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive component documentation
- Test components across different screen sizes
- Ensure accessibility compliance

### Component Guidelines
- Keep components under 200 lines when possible
- Use proper TypeScript interfaces
- Implement error boundaries for complex components
- Follow the established design system
- Document props and usage examples

## 🐛 Troubleshooting

### Common Issues

#### API Key Issues
```bash
# Check if API keys are properly set
console.log(process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Gemini: ✓' : 'Gemini: ✗');
```

#### Database Issues
- Ensure Supabase URL and keys are correct
- Check if required tables exist by visiting `/dashboard`
- Use the database setup tool in the UI

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Demo Mode
If you see "demo-mode" responses, check that your API keys are properly configured in `.env.local`.

## 📈 Performance

### Optimization Features
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Dynamic imports for large components
- **Caching**: Smart caching for API responses
- **Bundle Analysis**: Optimized chunk splitting
- **Lazy Loading**: Components loaded on demand

### Core Web Vitals
- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)  
- **CLS**: < 0.1 (Cumulative Layout Shift)

## 🌐 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** for advanced AI capabilities
- **ElevenLabs** for professional voice synthesis
- **Recraft AI** for image generation technology
- **Supabase** for backend infrastructure
- **Vercel** for deployment platform
- **Shadcn/ui** for beautiful components

## 📞 Support

### Documentation
- **Component Docs**: `/docs` - Complete component documentation
- **API Reference**: `/docs/api` - API endpoint documentation  
- **Best Practices**: `/docs/best-practices` - Development guidelines

### Help & Support
- **Contact**: [Contact page](/contact)
- **GitHub Issues**: For bug reports and feature requests
- **Community**: Join our Discord for community support
- **Email**: support@aibrandcreator.com

### Resources
- **Blog**: Latest news and tutorials
- **Case Studies**: Real-world implementation examples
- **Video Tutorials**: Step-by-step guides
- **FAQ**: Common questions and answers

## 🔄 Version History

### Current Version: 1.0.0
- Initial release with core brand analysis features
- Complete voice content studio
- Visual identity creation tools
- Content management dashboard
- Multi-AI integration (Gemini, ElevenLabs, Recraft)

### Upcoming Features
- Advanced analytics dashboard
- Team collaboration improvements
- Mobile app companion
- API marketplace integration
- White-label solutions

---

Built with ❤️ by the AI Brand Creator team. Transforming business ideas into powerful brand identities with AI.