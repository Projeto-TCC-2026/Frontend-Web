import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ButtonComponent, CardComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private scrollListener: (() => void) | null = null;
  public mobileMenuOpen = false;

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
    this.mobileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  goToRegister(type: string = 'paciente'): void {
    this.mobileMenuOpen = false;
    this.router.navigate(['/cadastro'], { fragment: type });
  }

  scrollToSection(sectionId: string): void {
    this.mobileMenuOpen = false;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToTop(): void {
    this.mobileMenuOpen = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  private updateActiveNav(): void {
    const sections = ['features', 'how', 'footer'];
    const navLinks = document.querySelectorAll('[data-nav-link]');
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

    navLinks.forEach((link) => {
      const section = link.getAttribute('data-nav-link');
      link.classList.remove('text-[var(--color-neutro-150)]');
      link.classList.add('text-[var(--color-neutro-500)]');

      const isActive =
        (!currentSection && section === 'inicio') ||
        (currentSection === 'features' && section === 'features') ||
        (currentSection === 'how' && section === 'how') ||
        (currentSection === 'footer' && section === 'footer');

      if (isActive) {
        link.classList.remove('text-[var(--color-neutro-500)]');
        link.classList.add('text-[var(--color-neutro-150)]');
      }
    });
  }
}
