// frontend/src/utils/dateFormatter.js
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatMessageDate = (date) => {
  try {
    if (!date) return '';
    
    const messageDate = new Date(date);
    
    // Vérifier si la date est valide
    if (isNaN(messageDate.getTime())) {
      return '';
    }
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    }
    
    if (isYesterday(messageDate)) {
      return 'Hier';
    }
    
    return format(messageDate, 'dd/MM/yyyy');
  } catch (error) {
    console.error('❌ Erreur formatMessageDate:', error);
    return '';
  }
};

export const formatLastSeen = (date) => {
  try {
    if (!date) return 'Jamais en ligne';
    
    const lastSeenDate = new Date(date);
    
    // Vérifier si la date est valide
    if (isNaN(lastSeenDate.getTime())) {
      return 'Jamais en ligne';
    }
    
    return formatDistanceToNow(lastSeenDate, { 
      addSuffix: true, 
      locale: fr 
    });
  } catch (error) {
    console.error('❌ Erreur formatLastSeen:', error);
    return 'Jamais en ligne';
  }
};