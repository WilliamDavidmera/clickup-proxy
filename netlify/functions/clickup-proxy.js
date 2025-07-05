exports.handler = async (event, context) => {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parsear datos del webhook de N8N
    const taskData = JSON.parse(event.body);
    
    console.log('Received task data:', taskData);

    // Llamar a ClickUp API
    const response = await fetch('https://api.clickup.com/api/v2/list/901704927862/task', {
      method: 'POST',
      headers: {
        'Authorization': 'pk_89276753_LHAJK6S0LFAN7TCAJ32Y4P7EJEEMKSM8',
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function-Proxy/1.0'
      },
      body: JSON.stringify(taskData)
    });

    const result = await response.json();
    
    console.log('ClickUp response:', result);

    // Retornar respuesta de ClickUp
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
