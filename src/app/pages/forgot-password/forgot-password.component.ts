import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
    templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
    private readonly notificationService = inject(NotificationService);
    private readonly router = inject(Router);
    private readonly apiService = inject(ApiService);

    public email: string = '';
    public isSubmitting: boolean = false;

    onSubmit(): void {
        if (!this.email) {
            this.notificationService.error('Informe o e-mail cadastrado para continuar.');
            return;
        }

        this.isSubmitting = true;

        this.apiService.post('/forgot-password/request', { email: this.email }).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.notificationService.success('Se o e-mail estiver cadastrado, enviamos as instruções.');
                this.email = '';
            },
            error: () => {
                this.isSubmitting = false;
                this.notificationService.success('Se o e-mail estiver cadastrado, enviamos as instruções.');
                this.email = '';
            },
        });
    }

    public goToLogin(): void {
        this.router.navigate(['/login']);
    }

    public goToHome(): void {
        this.router.navigate(['/']);
    }
}
