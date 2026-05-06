const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://txsfdlgtfgcvpfmxzhdw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4c2ZkbGd0ZmdjdnBmbXh6aGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDYwNTksImV4cCI6MjA5MzE4MjA1OX0.61VTeZ_DdMpBRb7Fbo3vqQwyp37X8Sv01Qr-9IeVWDU",
);

async function run() {
  await supabase.auth.resetPasswordForEmail("medinfo.ieeesbipb@gmail.com", {
    redirectTo: "http://localhost:3000/reset-password",
  });
}

run();
