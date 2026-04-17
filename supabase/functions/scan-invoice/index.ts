// Edge function: scan pharmaceutical invoice photo and extract medicine line items
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataUrl = `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at reading pharmaceutical supplier invoices. Extract every medicine line item. Be accurate with names and quantities. If a field is not visible, omit it.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all medicine line items from this invoice. Use the extract_invoice_items tool.",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice_items",
              description: "Return all medicine line items from the invoice",
              parameters: {
                type: "object",
                properties: {
                  invoiceNo: { type: "string", description: "Invoice number if visible" },
                  totalAmount: { type: "number", description: "Invoice grand total if visible" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Medicine brand name" },
                        generic: { type: "string", description: "Generic / salt name if visible" },
                        qty: { type: "number", description: "Quantity / units" },
                        batch: { type: "string", description: "Batch or lot number" },
                        expiry: { type: "string", description: "Expiry as YYYY-MM if visible" },
                        unitPrice: { type: "number", description: "Trade price per unit" },
                        total: { type: "number", description: "Line total" },
                      },
                      required: ["name", "qty"],
                    },
                  },
                },
                required: ["items"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice_items" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No items extracted", items: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments || "{}");
    return new Response(JSON.stringify(args), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-invoice error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
