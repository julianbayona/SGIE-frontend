import React from 'react';

interface PageTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ eyebrow, title, description, actions, children }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-300 bg-[linear-gradient(135deg,#fbf8f1_0%,#efe4cf_62%,#d9c17b_100%)] px-5 py-4 shadow-xl shadow-stone-900/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#A8841C]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1 font-serif text-2xl font-black leading-tight text-stone-950">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm font-medium leading-5 text-stone-600">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
};

export default PageTitle;
