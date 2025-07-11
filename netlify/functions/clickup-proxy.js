const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Headers CORS para todas las respuestas
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parsear datos del webhook de N8N
    let taskData;
    try {
      taskData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    console.log('Received task data:', JSON.stringify(taskData, null, 2));

    // Preparar datos para ClickUp
    const clickupData = {
      name: taskData.name || taskData.title || 'Tarea desde N8N',
      description: taskData.description || 'Descripción automática',
      status: 'to do',
      priority: taskData.priority || 3
    };

    console.log('Sending to ClickUp:', JSON.stringify(clickupData, null, 2));

    // Llamar a ClickUp API
    const response = await fetch('https://api.clickup.com/api/v2/list/901704927862/task', {
      method: 'POST',
      headers: {
        'Authorization': 'pk_89276753_LHAJK6S0LFAN7TCAJ32Y4P7EJEEMKSM8',
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function-Proxy/1.0'
      },
      body: JSON.stringify(clickupData)
    });

    const result = await response.json();
    
    console.log('ClickUp response status:', response.status);
    console.log('ClickUp response:', JSON.stringify(result, null, 2));

    // Retornar respuesta de ClickUp
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify({
        success: response.ok,
        clickup_response: result,
        sent_data: clickupData
      })
    };

  } catch (error) {
    console.error('Error in function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack 
      })
    };
  }
};
