import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import healtlabErrorImg from '../../assets/icons/HEALTLAB_ERROR.png';
import './NotFound.css';

interface NotFoundProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

const NotFound: React.FC<NotFoundProps> = ({
  title = 'Error 404',
  subtitle = 'Página no encontrada',
  description = 'La sección a la que intentas acceder no existe o se encuentra actualmente en desarrollo.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="card not-found-card">
        {/* Error Image */}
        <div className="not-found-card__image-wrapper">
          <img
            src={healtlabErrorImg}
            alt="HEALTLAB Error 404"
            className="not-found-card__img"
          />
        </div>

        {/* Text Details */}
        <div className="not-found-card__content">
          <h1 className="not-found-card__title">{title}</h1>
          <h2 className="not-found-card__subtitle">{subtitle}</h2>
          <p className="not-found-card__description">{description}</p>

          {/* Action Buttons */}
          <div className="not-found-card__actions">
            <button
              type="button"
              className="not-found-card__btn not-found-card__btn--primary"
              onClick={() => navigate('/admin')}
            >
              <Home size={18} />
              <span>Volver a Inicio</span>
            </button>
            <button
              type="button"
              className="not-found-card__btn not-found-card__btn--secondary"
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

export default NotFound;
