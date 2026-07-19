import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss']
})
export class CadastroComponent implements OnInit {
  activeTab: string = 'medico';

  // Médico form fields
  medicoNome = ''; medicoCpf = ''; medicoNascimento = ''; medicoEmail = '';
  medicoCrm = ''; medicoEspecialidade = ''; medicoTelefone = ''; medicoHospital = '';
  medicoSenha = ''; medicoConfirmarSenha = '';
  medicoTermos = false; medicoVeracidade = false;
  medicoEspecialidadeDropdownOpen = false;

  // Paciente form fields
  pacienteNome = ''; pacienteCpf = ''; pacienteNascimento = ''; pacienteTelefone = '';
  pacienteGenero = ''; pacienteEmail = ''; pacienteCep = ''; pacienteEstado = '';
  pacienteCidade = ''; pacienteBairro = ''; pacienteResponsavel = '';
  pacienteTelefoneEmergencia = ''; pacienteParentesco = '';
  pacienteSenha = ''; pacienteConfirmarSenha = '';
  pacienteTermos = false; pacienteDados = false;
  pacienteGeneroDropdownOpen = false;
  pacienteEstadoDropdownOpen = false;
  pacienteParentescoDropdownOpen = false;

  especialidades = ['Cirurgia Geral','Cardiologia','Ortopedia','Neurologia','Ginecologia','Urologia','Dermatologia','Pediatria'];
  generos = ['Masculino','Feminino','Outro','Prefiro não informar'];
  estados = ['Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins'];
  parentescos = ['Cônjuge','Pai','Mãe','Filho(a)','Irmão(ã)','Outro'];

  errors: {[key: string]: string} = {};

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'paciente' || fragment === 'medico') {
        this.activeTab = fragment;
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([], { fragment: tab, replaceUrl: true });
  }

  formatCPF(value: string): string {
    return value.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})/,'$1-$2').replace(/(-\d{2})\d+?$/,'$1');
  }
  formatPhone(value: string): string {
    return value.replace(/\D/g,'').replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2').replace(/(-\d{4})\d+?$/,'$1');
  }
  formatDate(value: string): string {
    return value.replace(/\D/g,'').replace(/(\d{2})(\d)/,'$1/$2').replace(/(\d{2})(\d)/,'$1/$2').replace(/(\d{4})\d+?$/,'$1');
  }
  formatCEP(value: string): string {
    return value.replace(/\D/g,'').replace(/(\d{5})(\d)/,'$1-$2').replace(/(-\d{3})\d+?$/,'$1');
  }

  isValidCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]+/g,'');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let sum = 0, remainder: number;
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i-1,i))*(11-i);
    remainder = (sum*10)%11; if(remainder===10||remainder===11) remainder=0;
    if(remainder !== parseInt(cpf.substring(9,10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i-1,i))*(12-i);
    remainder = (sum*10)%11; if(remainder===10||remainder===11) remainder=0;
    if(remainder !== parseInt(cpf.substring(10,11))) return false;
    return true;
  }
  isValidEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  isValidDate(date: string): boolean {
    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if(!match) return false;
    const [,d,m,y] = match.map(Number);
    return m>=1&&m<=12&&d>=1&&d<=31&&y>=1900&&y<=new Date().getFullYear();
  }

  onInput(field: string, value: string, formatter?: (v: string) => string): void {
    (this as any)[field] = formatter ? formatter(value) : value;
    delete this.errors[field];
  }

  selectOption(field: string, value: string, dropdownField: string): void {
    (this as any)[field] = value;
    (this as any)[dropdownField] = false;
    delete this.errors[field];
  }

  submitMedico(): void {
    this.errors = {};
    if (!this.medicoNome.trim()) this.errors['medicoNome'] = 'Nome completo é obrigatório';
    if (!this.isValidCPF(this.medicoCpf)) this.errors['medicoCpf'] = 'CPF inválido';
    if (!this.isValidDate(this.medicoNascimento)) this.errors['medicoNascimento'] = 'Data inválida';
    if (!this.isValidEmail(this.medicoEmail)) this.errors['medicoEmail'] = 'E-mail inválido';
    if (!this.medicoCrm.trim()) this.errors['medicoCrm'] = 'CRM é obrigatório';
    if (!this.medicoEspecialidade.trim()) this.errors['medicoEspecialidade'] = 'Especialidade é obrigatória';
    if (this.medicoTelefone.replace(/\D/g,'').length < 10) this.errors['medicoTelefone'] = 'Telefone inválido';
    if (!this.medicoHospital.trim()) this.errors['medicoHospital'] = 'Hospital/Clínica é obrigatório';
    if (this.medicoSenha.length < 8) this.errors['medicoSenha'] = 'Senha deve ter pelo menos 8 caracteres';
    if (this.medicoSenha !== this.medicoConfirmarSenha) this.errors['medicoConfirmarSenha'] = 'Senhas não coincidem';
    if (!this.medicoTermos || !this.medicoVeracidade) { alert('Por favor, aceite os termos e confirme a veracidade das informações.'); return; }
    if (Object.keys(this.errors).length > 0) return;
    alert('Cadastro enviado com sucesso! Você receberá um e-mail de confirmação em até 24 horas úteis.');
  }

  submitPaciente(): void {
    this.errors = {};
    if (!this.pacienteNome.trim()) this.errors['pacienteNome'] = 'Nome completo é obrigatório';
    if (!this.isValidCPF(this.pacienteCpf)) this.errors['pacienteCpf'] = 'CPF inválido';
    if (!this.isValidDate(this.pacienteNascimento)) this.errors['pacienteNascimento'] = 'Data inválida';
    if (this.pacienteTelefone.replace(/\D/g,'').length < 10) this.errors['pacienteTelefone'] = 'Telefone inválido';
    if (!this.pacienteGenero.trim()) this.errors['pacienteGenero'] = 'Gênero é obrigatório';
    if (!this.isValidEmail(this.pacienteEmail)) this.errors['pacienteEmail'] = 'E-mail inválido';
    if (this.pacienteCep.replace(/\D/g,'').length !== 8) this.errors['pacienteCep'] = 'CEP inválido';
    if (!this.pacienteEstado.trim()) this.errors['pacienteEstado'] = 'Estado é obrigatório';
    if (!this.pacienteCidade.trim()) this.errors['pacienteCidade'] = 'Cidade é obrigatória';
    if (!this.pacienteBairro.trim()) this.errors['pacienteBairro'] = 'Bairro é obrigatório';
    if (!this.pacienteResponsavel.trim()) this.errors['pacienteResponsavel'] = 'Nome do responsável é obrigatório';
    if (this.pacienteTelefoneEmergencia.replace(/\D/g,'').length < 10) this.errors['pacienteTelefoneEmergencia'] = 'Telefone inválido';
    if (!this.pacienteParentesco.trim()) this.errors['pacienteParentesco'] = 'Parentesco é obrigatório';
    if (this.pacienteSenha.length < 8) this.errors['pacienteSenha'] = 'Senha deve ter pelo menos 8 caracteres';
    if (this.pacienteSenha !== this.pacienteConfirmarSenha) this.errors['pacienteConfirmarSenha'] = 'Senhas não coincidem';
    if (!this.pacienteTermos || !this.pacienteDados) { alert('Por favor, aceite os termos e autorize o compartilhamento de dados.'); return; }
    if (Object.keys(this.errors).length > 0) return;
    alert('Conta criada com sucesso! Bem-vindo ao Recupera Saúde!');
  }

  onCepBlur(): void {
    const cep = this.pacienteCep.replace(/\D/g,'');
    if (cep.length === 8) {
      setTimeout(() => {
        this.pacienteCidade = 'São Paulo';
        this.pacienteBairro = 'Centro';
        this.pacienteEstado = 'São Paulo';
      }, 500);
    }
  }

  goToLogin(): void { this.router.navigate(['/login']); }
  goToHome(): void { this.router.navigate(['/']); }

  closeDropdowns(): void {
    this.medicoEspecialidadeDropdownOpen = false;
    this.pacienteGeneroDropdownOpen = false;
    this.pacienteEstadoDropdownOpen = false;
    this.pacienteParentescoDropdownOpen = false;
  }
}
