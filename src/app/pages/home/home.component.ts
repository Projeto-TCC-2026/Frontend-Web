import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private scrollListener: (() => void) | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.scrollListener = () => this.updateActiveNav();
    window.addEventListener('scroll', this.scrollListener);
  }

  ngOnDestroy(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(type: string = 'paciente'): void {
    this.router.navigate(['/cadastro'], { fragment: type });
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateActiveNav(): void {
    const sections = ['features', 'how', 'footer'];
    const navLinks = document.querySelectorAll('.nl');
    let currentSection = '';

    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentSection = sectionId;
        }
      }
    });

    navLinks.forEach((link, index) => {
      link.classList.remove('active');
      if (!currentSection && index === 0) link.classList.add('active');
      if (index === 1 && currentSection === 'how') link.classList.add('active');
      if (index === 3 && currentSection === 'footer') link.classList.add('active');
    });
  }
}
