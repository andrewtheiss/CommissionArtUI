import { NavigateFunction } from 'react-router-dom';

/**
 * Navigate to art detail as a page
 * @param artId The ID of the art piece
 * @param navigate The navigate function from useNavigate hook
 */
export const navigateToArtDetail = (artId: string, navigate: NavigateFunction): void => {
  navigate(`/myArt/${artId}`);
};

/**
 * Utility to determine if we should show art detail as a modal or navigate to a page
 * This can be extended with more complex logic in the future
 * @param preferModal Whether to prefer modal display
 * @param artId The ID of the art piece 
 * @param navigate The navigate function from useNavigate hook
 * @param openModalFn Function to open modal with the art ID
 */
export const showArtDetail = (
  preferModal: boolean,
  artId: string,
  navigate: NavigateFunction,
  openModalFn?: (artId: string) => void
): void => {
  if (preferModal && openModalFn) {
    openModalFn(artId);
  } else {
    navigateToArtDetail(artId, navigate);
  }
}; 