import React from 'react';
import PageTitle from '@/components/ui/PageTitle';

const QuotesHeader: React.FC = () => {
  return (
    <PageTitle
      eyebrow="Gestion comercial"
      title="Cotizaciones"
      description="Consulta versiones, estados y valores economicos asociados a los eventos."
    />
  );
};

export default QuotesHeader;
