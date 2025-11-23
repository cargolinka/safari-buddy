import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting empty legs expiry check...');

    // Get current timestamp
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    console.log(`Current date: ${currentDate}, Current time: ${currentTime}`);

    // Find all available empty legs where departure has passed
    const { data: expiredLegs, error: fetchError } = await supabase
      .from('empty_legs')
      .select('id, origin, destination, departure_date, departure_time')
      .eq('status', 'available')
      .or(`departure_date.lt.${currentDate},and(departure_date.eq.${currentDate},departure_time.lte.${currentTime})`);

    if (fetchError) {
      console.error('Error fetching empty legs:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredLegs?.length || 0} empty legs to expire`);

    if (expiredLegs && expiredLegs.length > 0) {
      // Mark them as expired
      const expiredIds = expiredLegs.map(leg => leg.id);
      
      const { error: updateError } = await supabase
        .from('empty_legs')
        .update({ status: 'expired' })
        .in('id', expiredIds);

      if (updateError) {
        console.error('Error updating empty legs:', updateError);
        throw updateError;
      }

      console.log(`Successfully expired ${expiredLegs.length} empty legs:`, 
        expiredLegs.map(leg => `${leg.origin} -> ${leg.destination} (${leg.departure_date} ${leg.departure_time})`));

      return new Response(
        JSON.stringify({
          success: true,
          message: `Expired ${expiredLegs.length} empty legs`,
          expired: expiredLegs.map(leg => ({
            id: leg.id,
            route: `${leg.origin} -> ${leg.destination}`,
            departure: `${leg.departure_date} ${leg.departure_time}`
          }))
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('No empty legs to expire');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'No empty legs to expire',
        expired: []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in expire-empty-legs function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
