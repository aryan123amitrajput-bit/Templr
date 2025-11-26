
export interface Template {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  likes: number;
  views: number;
  isLiked: boolean;
  category: string;
  description: string;
  price: string; // 'Free' or '$XX'
  
  // New Fields for File System & Dashboard
  fileUrl?: string; // The actual asset download link
  fileName?: string; // Original filename
  fileType?: string; // zip, fig, etc.
  status: 'approved' | 'pending' | 'rejected';
  sales: number;
  earnings: number;
}

export const templates: Template[] = [
  { id: '1', title: 'Cyberpunk Portfolio', author: 'NexusDesigns', imageUrl: 'https://picsum.photos/seed/template1/600/400', likes: 1340, views: 25000, isLiked: false, category: 'Portfolio', description: 'A dark, futuristic portfolio template with neon accents, perfect for developers and digital artists.', price: '$49', status: 'approved', sales: 120, earnings: 5880, fileUrl: 'https://example.com' },
  { id: '2', title: 'SaaS Landing Page', author: 'PixelPerfect', imageUrl: 'https://picsum.photos/seed/template2/600/400', likes: 2100, views: 42000, isLiked: false, category: 'SaaS', description: 'Clean and modern landing page for a software-as-a-service product, focusing on conversions.', price: 'Free', status: 'approved', sales: 0, earnings: 0, fileUrl: 'https://ui.shadcn.com/' },
  { id: '3', title: 'Crypto Dashboard', author: 'ChainUI', imageUrl: 'https://picsum.photos/seed/template3/600/400', likes: 980, views: 18000, isLiked: false, category: 'Dashboard', description: 'A comprehensive dashboard for tracking cryptocurrency prices and managing portfolios.', price: '$89', status: 'approved', sales: 45, earnings: 4005, fileUrl: 'https://coinmarketcap.com/' },
  { id: '4', title: 'E-commerce Store', author: 'ShopifyMasters', imageUrl: 'https://picsum.photos/seed/template4/600/400', likes: 5600, views: 112000, isLiked: false, category: 'E-commerce', description: 'A minimalist and elegant e-commerce template designed to showcase products beautifully.', price: '$120', status: 'approved', sales: 310, earnings: 37200, fileUrl: 'https://shopify.com' },
  { id: '5', title: 'AI Startup Pitch', author: 'FutureVision', imageUrl: 'https://picsum.photos/seed/template5/600/400', likes: 3250, views: 61000, isLiked: false, category: 'SaaS', description: 'A compelling pitch deck template for AI and tech startups, designed to impress investors.', price: 'Free', status: 'approved', sales: 0, earnings: 0, fileUrl: 'https://openai.com' },
  { id: '6', title: 'Gaming Community Hub', author: 'GlitchWorks', imageUrl: 'https://picsum.photos/seed/template6/600/400', likes: 4100, views: 98000, isLiked: false, category: 'Community', description: 'An engaging hub for gaming communities, featuring forums, member profiles, and event calendars.', price: '$35', status: 'approved', sales: 85, earnings: 2975, fileUrl: 'https://discord.com' },
  { id: '7', title: 'Minimalist Blog', author: 'Wordsmith', imageUrl: 'https://picsum.photos/seed/template7/600/400', likes: 1800, views: 35000, isLiked: false, category: 'Blog', description: 'A content-focused blog template with beautiful typography and a clean, distraction-free reading experience.', price: 'Free', status: 'approved', sales: 0, earnings: 0, fileUrl: 'https://vercel.com/templates' },
  { id: '8', title: 'Digital Agency', author: 'CreativeFlow', imageUrl: 'https://picsum.photos/seed/template8/600/400', likes: 2900, views: 54000, isLiked: false, category: 'Portfolio', description: 'A professional and stylish template for digital agencies to showcase their work and services.', price: '$200', status: 'approved', sales: 15, earnings: 3000, fileUrl: '#' },
  { id: '9', title: 'Fitness App UI', author: 'FitDesign', imageUrl: 'https://picsum.photos/seed/template9/600/400', likes: 3500, views: 72000, isLiked: false, category: 'Dashboard', description: 'A vibrant and motivating UI kit for a fitness tracking application, with charts and progress trackers.', price: '$55', status: 'approved', sales: 60, earnings: 3300, fileUrl: '#' },
  { id: '10', title: 'Recipe Sharing Platform', author: 'CooksCorner', imageUrl: 'https://picsum.photos/seed/template10/600/400', likes: 2400, views: 48000, isLiked: false, category: 'Community', description: 'A community-driven platform for sharing and discovering new recipes, with user ratings and collections.', price: 'Free', status: 'approved', sales: 0, earnings: 0, fileUrl: '#' },
  { id: '11', title: 'Tech Conference Event', author: 'EventPro', imageUrl: 'https://picsum.photos/seed/template11/600/400', likes: 1500, views: 31000, isLiked: false, category: 'Community', description: 'A sleek and informative one-page template for tech conferences and events, with speaker profiles and schedules.', price: '$25', status: 'approved', sales: 40, earnings: 1000, fileUrl: '#' },
  { id: '12', title: 'Photography Portfolio', author: 'Shutterbug', imageUrl: 'https://picsum.photos/seed/template12/600/400', likes: 4800, views: 95000, isLiked: false, category: 'Portfolio', description: 'A visually stunning portfolio for photographers, featuring fullscreen image galleries and elegant transitions.', price: '$75', status: 'approved', sales: 150, earnings: 11250, fileUrl: '#' }
];
