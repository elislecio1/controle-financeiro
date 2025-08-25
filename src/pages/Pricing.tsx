import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../types/saas';
import { tenantService } from '../services/tenantService';

const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    contactName: '',
    email: '',
    phone: '',
    planId: '',
    customDomain: '',
    users: 1,
    notes: ''
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const availablePlans = await tenantService.getAvailablePlans();
      setPlans(availablePlans);
    } catch (error) {
      console.error('❌ Erro ao carregar planos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData(prev => ({ ...prev, planId: plan.id }));
    setShowModal(true);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!selectedPlan) return;

      // Validar dados
      if (!formData.companyName || !formData.subdomain || !formData.email) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }

      // Criar tenant
      const tenant = await tenantService.createTenant({
        name: formData.companyName,
        slug: formData.subdomain.toLowerCase(),
        subdomain: formData.subdomain.toLowerCase(),
        plan_id: selectedPlan.id,
        settings: {
          branding: {
            primary_color: '#3182CE',
            company_name: formData.companyName,
            support_email: formData.email
          }
        }
      });

      if (tenant) {
        alert('Sua conta foi criada com sucesso! Em breve entraremos em contato.');
        setShowModal(false);
        setFormData({
          companyName: '',
          subdomain: '',
          contactName: '',
          email: '',
          phone: '',
          planId: '',
          customDomain: '',
          users: 1,
          notes: ''
        });
      }
    } catch (error) {
      console.error('❌ Erro ao criar tenant:', error);
      alert('Não foi possível criar sua conta. Tente novamente.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPopularPlan = () => {
    return plans.find(plan => plan.slug === 'business') || plans[1];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">Carregando planos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Escolha o Plano Ideal para sua Empresa
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Oferecemos planos flexíveis que crescem com seu negócio. 
            Comece grátis e atualize conforme necessário.
          </p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const isPopular = plan.id === getPopularPlan()?.id;
            
            return (
              <div 
                key={plan.id} 
                className={`relative bg-white rounded-lg shadow-lg p-6 border-2 transition-all hover:scale-105 ${
                  isPopular ? 'border-blue-500 scale-105' : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ⭐ Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {formatPrice(plan.price)}
                  </div>
                  <div className="text-gray-500">
                    /{plan.interval === 'monthly' ? 'mês' : 'ano'}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature.id} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-600">
                        {feature.description}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isPopular 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  Começar Agora
                </button>
              </div>
            );
          })}
        </div>

        {/* Comparação de Recursos */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-8">
            Comparação Detalhada
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4">Recurso</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center p-4">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 font-medium">Usuários</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.limits.users}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 font-medium">Transações/mês</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.limits.transactions_per_month.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium">Armazenamento</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.limits.storage_mb} MB
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 font-medium">Integrações</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.limits.integrations}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium">Suporte</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.limits.support_level === 'basic' && 'Básico'}
                      {plan.limits.support_level === 'priority' && 'Prioritário'}
                      {plan.limits.support_level === 'dedicated' && 'Dedicado'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Criação de Conta */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Criar Nova Conta</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o nome da sua empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subdomínio *</label>
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => handleInputChange('subdomain', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="suaempresa"
                  />
                  <p className="text-xs text-gray-500 mt-1">.controlefinanceiro.com.br</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome do Contato *</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Número de Usuários</label>
                  <select
                    value={formData.users}
                    onChange={(e) => handleInputChange('users', parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 usuário</option>
                    <option value={5}>5 usuários</option>
                    <option value={10}>10 usuários</option>
                    <option value={20}>20 usuários</option>
                    <option value={50}>50+ usuários</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Alguma observação especial..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded">
                  <p className="font-medium mb-1">
                    Plano Selecionado: {selectedPlan?.name}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedPlan && formatPrice(selectedPlan.price)}/{selectedPlan?.interval === 'monthly' ? 'mês' : 'ano'}
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Criar Conta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
