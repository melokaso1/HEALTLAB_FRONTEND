import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import healtlabErrorImg from '../../assets/icons/HEALTLAB_ERROR.png';
import './Forbidden.css';

interface ForbiddenProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

const Forbidden: React.FC<ForbiddenProps> = ({
  title = 'Error 403',
  subtitle = 'Acceso Denegado',
  description = 'No tienes los permisos necesarios para acceder a esta página o recurso del sistema.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="forbidden-container">
      <div className="card forbidden-card">
        {/* Error Image */}
        <div className="forbidden-card__image-wrapper">
          <img
            src={healtlabErrorImg}
            alt="HEALTLAB Error 403"
            className="forbidden-card__img"
          />
        </div>

        {/* Text Details */}
        <div className="forbidden-card__content">
          <div className="forbidden-card__badge">
            <ShieldAlert size={16} />
            <span>Acceso Restringido</span>
          </div>

          <h1 className="forbidden-card__title">{title}</h1>
          <h2 className="forbidden-card__subtitle">{subtitle}</h2>
          <p className="forbidden-card__description">{description}</p>

          {/* Action Buttons */}
          <div className="forbidden-card__actions">
            <button
              type="button"
              className="forbidden-card__btn forbidden-card__btn--primary"
              onClick={() => navigate('/inicio')}
            >
              <Home size={18} />
              <span>Volver a Inicio</span>
            </button>
            <button
              type="button"
              className="forbidden-card__btn forbidden-card__btn--secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} />
              <span>Regresar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
