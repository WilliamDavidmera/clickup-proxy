const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    console.log('Received data:', JSON.stringify(requestData, null, 2));
    
    // Verificar si es el formato nuevo (con múltiples tareas)
    if (requestData.tasks && Array.isArray(requestData.tasks)) {
      console.log('Processing multiple tasks:', requestData.tasks.length);
      
      const results = [];
      
      // Procesar cada tarea
      for (let i = 0; i < requestData.tasks.length; i++) {
        const task = requestData.tasks[i];
        
        console.log(`Processing task ${i + 1}:`, task.name);
        
        const clickupData = {
          name: task.name || 'Tarea sin título',
          description: task.description || 'Sin descripción',
          priority: task.priority || 3,
          status: task.status || 'to do',
          tags: task.tags || []
        };
        
        console.log(`Sending task ${i + 1} to ClickUp:`, JSON.stringify(clickupData, null, 2));
        
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
        
        console.log(`ClickUp response for task ${i + 1}:`, response.status);
        console.log(`ClickUp result for task ${i + 1}:`, JSON.stringify(result, null, 2));
        
        if (response.ok) {
          results.push({
            task_number: i + 1,
            task_name: task.name,
            clickup_id: result.id,
            clickup_url: result.url,
            success: true
          });
        } else {
          results.push({
            task_number: i + 1,
            task_name: task.name,
            success: false,
            error: result.err || 'Error desconocido'
          });
        }
      }
      
      // Respuesta final para múltiples tareas
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          tasks_processed: requestData.tasks.length,
          tasks_created: results.filter(r => r.success).length,
          tasks_failed: results.filter(r => !r.success).length,
          results: results,
          meeting_info: requestData.meeting_info || {},
          metadata: requestData.metadata || {}
        })
      };
      
    } else {
      // Formato antiguo (una sola tarea) - mantener compatibilidad
      console.log('Processing single task (legacy format)');
      
      const clickupData = {
        name: requestData.name || requestData.title || 'Tarea desde N8N',
        description: requestData.description || 'Descripción automática',
        priority: requestData.priority || 3
      };
      
      console.log('Sending to ClickUp:', JSON.stringify(clickupData, null, 2));
      
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
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: response.ok,
          clickup_response: result,
          sent_data: clickupData
        })
      };
    }
    
  } catch (error) {
    console.error('Error in function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
