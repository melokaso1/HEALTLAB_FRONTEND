import React from 'react';
import { Loader2, Activity } from 'lucide-react';
import './Loading.css';

export interface LoadingProps {
  /** Texto a mostrar debajo del indicador de carga. Por defecto "Cargando..." */
  text?: string;
  /** Tamaño del componente: 'sm' | 'md' | 'lg' | 'xl' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Si se debe mostrar a pantalla completa con fondo overlay */
  fullScreen?: boolean;
  /** Si se debe mostrar centrado con fondo overlay dentro de su contenedor */
  overlay?: boolean;
  /** Variante visual: 'ring' | 'pulse' | 'dots' */
  variant?: 'ring' | 'pulse' | 'dots';
  /** Clases CSS adicionales */
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  text = 'Cargando...',
  size = 'md',
  fullScreen = false,
  overlay = false,
  variant = 'ring',
  className = '',
}) => {
  const containerClasses = [
    'hl-loading',
    `hl-loading--${size}`,
    fullScreen ? 'hl-loading--fullscreen' : '',
    overlay ? 'hl-loading--overlay' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="hl-loading__content">
        {variant === 'ring' && (
          <div className="hl-loading__ring-wrapper">
            <div className="hl-loading__ring-outer" />
            <div className="hl-loading__ring-inner" />
            <Loader2 className="hl-loading__spinner-icon" />
          </div>
        )}

        {variant === 'pulse' && (
          <div className="hl-loading__pulse-wrapper">
            <div className="hl-loading__pulse-ping" />
            <div className="hl-loading__pulse-core">
              <Activity className="hl-loading__pulse-icon" />
            </div>
          </div>
        )}

        {variant === 'dots' && (
          <div className="hl-loading__dots-wrapper">
            <span className="hl-loading__dot hl-loading__dot--1" />
            <span className="hl-loading__dot hl-loading__dot--2" />
            <span className="hl-loading__dot hl-loading__dot--3" />
          </div>
        )}

        {text && (
          <p className="hl-loading__text">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;
