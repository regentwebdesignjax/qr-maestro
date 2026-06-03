import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, conversation_id, message, metadata } = body;

    if (action === 'create_conversation') {
      const conv = await base44.asServiceRole.agents.createConversation({
        agent_name: 'sensei_support',
        metadata: metadata || { name: 'Guest Support Chat' },
      });
      return Response.json(conv);
    }

    if (action === 'add_message') {
      if (!conversation_id || !message) {
        return Response.json({ error: 'conversation_id and message required' }, { status: 400 });
      }
      const result = await base44.asServiceRole.agents.addMessage(
        { id: conversation_id },
        message
      );
      return Response.json(result);
    }

    if (action === 'get_conversation') {
      if (!conversation_id) {
        return Response.json({ error: 'conversation_id required' }, { status: 400 });
      }
      const conv = await base44.asServiceRole.agents.getConversation(conversation_id);
      return Response.json(conv);
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});