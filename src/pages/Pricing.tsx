import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  CardHeader,
  List,
  ListItem,
  ListIcon,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Switch,
  Divider
} from '@chakra-ui/react';
import { CheckIcon, StarIcon } from '@chakra-ui/icons';
import { SubscriptionPlan } from '../types/saas';
import { tenantService } from '../services/tenantService';

const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

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
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos disponíveis',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData(prev => ({ ...prev, planId: plan.id }));
    onOpen();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!selectedPlan) return;

      // Validar dados
      if (!formData.companyName || !formData.subdomain || !formData.email) {
        toast({
          title: 'Dados incompletos',
          description: 'Preencha todos os campos obrigatórios',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
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
            company_name: formData.companyName,
            support_email: formData.email
          }
        }
      });

      if (tenant) {
        toast({
          title: 'Sucesso!',
          description: 'Sua conta foi criada com sucesso. Em breve entraremos em contato.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose();
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
      toast({
        title: 'Erro',
        description: 'Não foi possível criar sua conta. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      <Container maxW="container.xl" py={10}>
        <Text>Carregando planos...</Text>
      </Container>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={10}>
      <Container maxW="container.xl">
        {/* Header */}
        <VStack spacing={6} textAlign="center" mb={12}>
          <Heading size="2xl" color="gray.800">
            Escolha o Plano Ideal para sua Empresa
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl">
            Oferecemos planos flexíveis que crescem com seu negócio. 
            Comece grátis e atualize conforme necessário.
          </Text>
        </VStack>

        {/* Planos */}
        <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(300px, 1fr))" }} gap={6}>
          {plans.map((plan) => {
            const isPopular = plan.id === getPopularPlan()?.id;
            
            return (
              <Card 
                key={plan.id} 
                position="relative"
                border={isPopular ? "2px solid" : "1px solid"}
                borderColor={isPopular ? "blue.500" : "gray.200"}
                transform={isPopular ? "scale(1.05)" : "none"}
                transition="all 0.3s"
                _hover={{ transform: isPopular ? "scale(1.07)" : "scale(1.02)" }}
              >
                {isPopular && (
                  <Badge
                    position="absolute"
                    top={-3}
                    left="50%"
                    transform="translateX(-50%)"
                    colorScheme="blue"
                    variant="solid"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    <StarIcon mr={1} />
                    Mais Popular
                  </Badge>
                )}

                <CardHeader textAlign="center" pb={2}>
                  <Heading size="md" color="gray.800">
                    {plan.name}
                  </Heading>
                  <Text fontSize="3xl" fontWeight="bold" color="blue.600" mt={2}>
                    {formatPrice(plan.price)}
                    <Text as="span" fontSize="lg" color="gray.500">
                      /{plan.interval === 'monthly' ? 'mês' : 'ano'}
                    </Text>
                  </Text>
                </CardHeader>

                <CardBody pt={0}>
                  <List spacing={3} mb={6}>
                    {plan.features.map((feature) => (
                      <ListItem key={feature.id} display="flex" alignItems="center">
                        <ListIcon as={CheckIcon} color="green.500" />
                        <Text fontSize="sm">
                          {feature.description}
                        </Text>
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    colorScheme={isPopular ? "blue" : "gray"}
                    size="lg"
                    width="full"
                    onClick={() => handlePlanSelect(plan)}
                  >
                    Começar Agora
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </Box>

        {/* Comparação de Recursos */}
        <Box mt={16}>
          <Heading size="lg" textAlign="center" mb={8}>
            Comparação Detalhada
          </Heading>
          
          <Box overflowX="auto">
            <Box as="table" width="full" borderCollapse="collapse">
              <Box as="thead">
                <Box as="tr" borderBottom="1px solid" borderColor="gray.200">
                  <Box as="th" p={4} textAlign="left">Recurso</Box>
                  {plans.map(plan => (
                    <Box as="th" key={plan.id} p={4} textAlign="center">
                      {plan.name}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                <Box as="tr">
                  <Box as="td" p={4} fontWeight="medium">Usuários</Box>
                  {plans.map(plan => (
                    <Box as="td" key={plan.id} p={4} textAlign="center">
                      {plan.limits.users}
                    </Box>
                  ))}
                </Box>
                <Box as="tr" bg="gray.50">
                  <Box as="td" p={4} fontWeight="medium">Transações/mês</Box>
                  {plans.map(plan => (
                    <Box as="td" key={plan.id} p={4} textAlign="center">
                      {plan.limits.transactions_per_month.toLocaleString()}
                    </Box>
                  ))}
                </Box>
                <Box as="tr">
                  <Box as="td" p={4} fontWeight="medium">Armazenamento</Box>
                  {plans.map(plan => (
                    <Box as="td" key={plan.id} p={4} textAlign="center">
                      {plan.limits.storage_mb} MB
                    </Box>
                  ))}
                </Box>
                <Box as="tr" bg="gray.50">
                  <Box as="td" p={4} fontWeight="medium">Integrações</Box>
                  {plans.map(plan => (
                    <Box as="td" key={plan.id} p={4} textAlign="center">
                      {plan.limits.integrations}
                    </Box>
                  ))}
                </Box>
                <Box as="tr">
                  <Box as="td" p={4} fontWeight="medium">Suporte</Box>
                  {plans.map(plan => (
                    <Box as="td" key={plan.id} p={4} textAlign="center">
                      {plan.limits.support_level === 'basic' && 'Básico'}
                      {plan.limits.support_level === 'priority' && 'Prioritário'}
                      {plan.limits.support_level === 'dedicated' && 'Dedicado'}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Modal de Criação de Conta */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Criar Nova Conta</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Digite o nome da sua empresa"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Subdomínio</FormLabel>
                  <Input
                    value={formData.subdomain}
                    onChange={(e) => handleInputChange('subdomain', e.target.value)}
                    placeholder="suaempresa"
                    addonRight={<Text color="gray.500">.controlefinanceiro.com.br</Text>}
                  />
                </FormControl>

                <HStack spacing={4} width="full">
                  <FormControl isRequired>
                    <FormLabel>Nome do Contato</FormLabel>
                    <Input
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Telefone</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Número de Usuários</FormLabel>
                  <Select
                    value={formData.users}
                    onChange={(e) => handleInputChange('users', parseInt(e.target.value))}
                  >
                    <option value={1}>1 usuário</option>
                    <option value={5}>5 usuários</option>
                    <option value={10}>10 usuários</option>
                    <option value={20}>20 usuários</option>
                    <option value={50}>50+ usuários</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Observações</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Alguma observação especial ou necessidade específica..."
                    rows={3}
                  />
                </FormControl>

                <Divider />

                <Box width="full" p={4} bg="blue.50" borderRadius="md">
                  <Text fontWeight="medium" mb={2}>
                    Plano Selecionado: {selectedPlan?.name}
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">
                    {selectedPlan && formatPrice(selectedPlan.price)}/{selectedPlan?.interval === 'monthly' ? 'mês' : 'ano'}
                  </Text>
                </Box>

                <HStack spacing={4} width="full">
                  <Button onClick={onClose} variant="outline" flex={1}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} colorScheme="blue" flex={1}>
                    Criar Conta
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default Pricing;
