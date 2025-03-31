/**
 * YouTube Channel Video Links Scraper
 *
 * This script retrieves video links from a specified YouTube channel using the YouTube Data API.
 * It allows users to input the channel username and fetches the video links from the channel's upload playlist.
 *
 * IMPORTANT:
 * - Make a copy of this script to your own Google Apps Script project.
 * - Add your own OAuth2 credentials (Client ID and Client Secret) in the script properties:
 *    1. YOUTUBE_CLIENT_ID
 *    2. YOUTUBE_CLIENT_SECRET
 *
 * Features:
 * - OAuth2 authentication to access YouTube Data API.
 * - Web app interface for user input.
 * - Displays video links directly on the web page.
 *
 * Instructions:
 * 1. Deploy the script as a web app.
 * 2. Access the web app using the provided URL.
 * 3. Enter the YouTube channel username to retrieve video links.
 *
 * GitHub Repository:
 * https://github.com/luascfl/youtube-channel-scraper
 *
 *
 * ----------------------------------------------------------------------------------------------------
 *
 * Script para Obter Links de Vídeos de um Canal do YouTube
 *
 * Este script obtém links de vídeos de um canal do YouTube especificado usando a API de Dados do YouTube.
 * Permite que os usuários insiram o nome de usuário do canal e busquem os links dos vídeos da playlist de uploads do canal.
 *
 * IMPORTANTE:
 * - Faça uma cópia deste script para o seu próprio projeto do Google Apps Script.
 * - Adicione suas próprias credenciais OAuth2 (Client ID e Client Secret) nas propriedades do script:
 *    1. YOUTUBE_CLIENT_ID
 *    2. YOUTUBE_CLIENT_SECRET
 * 
 * Recursos:
 * - Autenticação OAuth2 para acessar a API de Dados do YouTube.
 * - Interface de aplicativo da web para entrada do usuário.
 * - Exibe links de vídeos diretamente na página da web.
 *
 * Instruções:
 * 1. Implante o script como um aplicativo da web.
 * 2. Acesse o aplicativo da web usando o URL fornecido.
 * 3. Insira o nome de usuário do canal do YouTube para obter os links dos vídeos.
 *
 * Repositório GitHub:
 * https://github.com/luascfl/youtube-channel-scraper
 *
 */

function getYouTubeVideoLinks(channelUsername) {
  // Check if channelUsername is provided
  // Verifica se channelUsername foi fornecido
  if (!channelUsername) {
    Logger.log('Please deploy this script as a web app and access it through the provided URL.');
    Logger.log('Por favor, implante este script como um aplicativo da web e acesse-o através do URL fornecido.');
    return;
  }

  Logger.log('Starting to retrieve video links from YouTube...');
  Logger.log('Iniciando a obtenção de links de vídeos do YouTube...');

  var service = getYouTubeService();
  if (service.hasAccess()) {
    Logger.log('Authorization successful.');
    Logger.log('Autenticação bem-sucedida.');

    Logger.log('Searching for channel ID for username: ' + channelUsername);
    Logger.log('Buscando ID do canal para o nome de usuário: ' + channelUsername);

    // Get the channel ID using the username
    // Obtém o ID do canal usando o nome de usuário
    var urlChannelSearch = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=' + channelUsername;
    var responseChannelSearch = UrlFetchApp.fetch(urlChannelSearch, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var dataChannelSearch = JSON.parse(responseChannelSearch.getContentText());

    if (dataChannelSearch.items.length === 0) {
      Logger.log('Channel not found.');
      Logger.log('Canal não encontrado.');
      return [];
    }

    var channelId = dataChannelSearch.items[0].snippet.channelId;
    Logger.log('Channel ID found: ' + channelId);
    Logger.log('ID do canal encontrado: ' + channelId);

    // Get the upload playlist ID of the channel
    // Obtém o ID da playlist de uploads do canal
    var urlChannels = 'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=' + channelId;
    var responseChannels = UrlFetchApp.fetch(urlChannels, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var dataChannels = JSON.parse(responseChannels.getContentText());

    var uploadsId = dataChannels.items[0].contentDetails.relatedPlaylists.uploads;
    Logger.log('Upload playlist ID: ' + uploadsId);
    Logger.log('ID da playlist de uploads: ' + uploadsId);

    var videoLinks = [];
    var nextPageToken = null;

    do {
      var urlVideos = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=' + uploadsId + '&maxResults=50';
      if (nextPageToken) {
        urlVideos += '&pageToken=' + nextPageToken;
      }

      var responseVideos = UrlFetchApp.fetch(urlVideos, {
        headers: {
          Authorization: 'Bearer ' + service.getAccessToken()
        }
      });
      var dataVideos = JSON.parse(responseVideos.getContentText());

      // Extract video links
      // Extrai os links dos vídeos
      var pageVideoLinks = dataVideos.items.map(function(item) {
        return 'https://www.youtube.com/watch?v=' + item.snippet.resourceId.videoId;
      });

      videoLinks = videoLinks.concat(pageVideoLinks);
      nextPageToken = dataVideos.nextPageToken;

    } while (nextPageToken);

    Logger.log('Video links obtained:');
    Logger.log('Links dos vídeos obtidos:');
    videoLinks.forEach(function(link) {
      Logger.log(link);
    });

    Logger.log('Process completed.');
    Logger.log('Processo concluído.');
    return videoLinks;
  } else {
    Logger.log('Authorization required.');
    Logger.log('Autenticação necessária.');
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Please authorize access by visiting this URL: ' + authorizationUrl);
    Logger.log('Por favor, autorize o acesso visitando este URL: ' + authorizationUrl);
    return [];
  }
}

function getYouTubeService() {
  Logger.log('Setting up OAuth2 service for YouTube...');
  Logger.log('Configurando o serviço OAuth2 para YouTube...');

  var scriptProperties = PropertiesService.getScriptProperties();

  var clientId = scriptProperties.getProperty('YOUTUBE_CLIENT_ID');
  var clientSecret = scriptProperties.getProperty('YOUTUBE_CLIENT_SECRET');

  return OAuth2.createService('YouTube')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://oauth2.googleapis.com/token')
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setPropertyStore(scriptProperties)
    .setScope('https://www.googleapis.com/auth/youtube.readonly')
    .setCallbackFunction('authCallback');
}

function authCallback(request) {
  var service = getYouTubeService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    Logger.log('Authorization successful.');
    Logger.log('Autenticação bem-sucedida.');
    return HtmlService.createHtmlOutput('Authorization successful!');
  } else {
    Logger.log('Authorization failed.');
    Logger.log('Autenticação falhou.');
    return HtmlService.createHtmlOutput('Authorization failed.');
  }
}

function doGet() {
  // Render the HTML file as the web app interface
  // Renderiza o arquivo HTML como a interface do aplicativo da web
  return HtmlService.createHtmlOutputFromFile('index');
}
