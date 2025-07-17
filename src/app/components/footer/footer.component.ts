import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  currentLang = 'en';
  newsletterEmail = '';

  constructor() { }

  ngOnInit(): void {
    // Get current language from localStorage or default
    this.currentLang = localStorage.getItem('language') || 'en';
  }

  // Language switching
  setLanguage(lang: string): void {
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    // TODO: Implement translation service
    // this.translateService.use(lang);
  }

  // Newsletter subscription
  subscribeNewsletter(): void {
    if (this.newsletterEmail && this.isValidEmail(this.newsletterEmail)) {
      // TODO: Implement newsletter subscription service
      console.log('Subscribing to newsletter:', this.newsletterEmail);
      
      // Show success message
      // this.toastr.success('Successfully subscribed to newsletter!');
      
      // Clear the input
      this.newsletterEmail = '';
    } else {
      // Show error message
      // this.toastr.error('Please enter a valid email address');
    }
  }

  // Email validation
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Scroll to top functionality
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Footer links
  quickLinks = [
    { label: 'About Us', url: '/about' },
    { label: 'Contact', url: '/contact' },
    { label: 'FAQ', url: '/faq' },
    { label: 'Shipping Info', url: '/shipping' },
    { label: 'Returns', url: '/returns' },
    { label: 'Size Guide', url: '/size-guide' }
  ];

  customerService = [
    { label: 'Help Center', url: '/help' },
    { label: 'Track Order', url: '/track-order' },
    { label: 'Size Guide', url: '/size-guide' },
    { label: 'Returns & Exchanges', url: '/returns' },
    { label: 'Contact Us', url: '/contact' }
  ];

  categories = [
    { label: 'Shop All', url: '/products' },
    { label: 'Tops', url: '/categories/tops' },
    { label: 'Bottoms', url: '/categories/bottoms' },
    { label: 'Outerwears', url: '/categories/outerwears' },
    { label: 'Underwears', url: '/categories/underwears' },
    { label: 'Accessories', url: '/categories/accessories' }
  ];

  socialLinks = [
    { 
      label: 'Facebook', 
      url: 'https://facebook.com/hadesvn', 
      icon: 'facebook',
      color: 'hover:text-blue-600'
    },
    { 
      label: 'Instagram', 
      url: 'https://instagram.com/hadesvn', 
      icon: 'instagram',
      color: 'hover:text-pink-600'
    },
    { 
      label: 'Twitter', 
      url: 'https://twitter.com/hadesvn', 
      icon: 'twitter',
      color: 'hover:text-blue-400'
    },
    { 
      label: 'YouTube', 
      url: 'https://youtube.com/hadesvn', 
      icon: 'youtube',
      color: 'hover:text-red-600'
    },
    { 
      label: 'TikTok', 
      url: 'https://tiktok.com/@hadesvn', 
      icon: 'tiktok',
      color: 'hover:text-black'
    }
  ];

  // Get social media icon
  getSocialIcon(platform: string): string {
    switch (platform) {
      case 'facebook':
        return 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';
      case 'instagram':
        return 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';
      case 'twitter':
        return 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z';
      case 'youtube':
        return 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z';
      case 'tiktok':
        return 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';
      default:
        return '';
    }
  }
} 