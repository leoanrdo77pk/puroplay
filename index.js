let finalHtml;
if (data.includes('</body>')) {
  finalHtml = data.replace('</body>', `

<!-- Banner fixo no rodapé -->
<div id="custom-footer">
  <a href="https://8xbet86.com/" target="_blank" rel="noopener noreferrer">
    <img src="https://i.imgur.com/Fen20UR.gif" 
         style="width:100%;max-height:100px;object-fit:contain;cursor:pointer;" 
         alt="Banner" />
  </a>
</div>

<style>
  #custom-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: transparent;
    text-align: center;
    z-index: 9999;
  }
  body { 
    padding-bottom: 120px !important; 
  }
</style>

<!-- Script PopIn -->
<script>
document.addEventListener("DOMContentLoaded", function() {
  var crakPopInParamsIframe = {
    url: 'https://t.mbsrv2.com/273605/10163/optimized?aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0016&aff_id=1&transaction_id=postitial',
    decryptUrl: false,
    contentUrl: 'https://t.mbsrv2.com/273605/10163/optimized?aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0016&aff_id=1&transaction_id=postitial',
    decryptContentUrl: false,
    contentType: 'iframe',
    width: '85%',
    height: '85%',
    timeout: false,
    delayClose: 0,
    clickStart: false,
    closeIntent: false,
    postitialBehavior: true,
    closeButtonColor: '#000',
    closeCrossColor: '#fff',
    shadow: true,
    shadowColor: '#000',
    shadowOpacity: '.5',
    shadeColor: '#111',
    shadeOpacity: '0',
    border: '1px',
    borderColor: '#000',
    borderRadius: '0px',
    leadOut: true,
    animation: 'slide',
    direction: 'up',
    verticalPosition: 'center',
    horizontalPosition: 'center',
    expireDays: 0.01
  };

  var script = document.createElement('script');
  script.src = "https://crxcr1.com/popin/latest/popin-min.js";
  document.body.appendChild(script);
});
</script>

</body>`);
} else {
  finalHtml = `${data}

<!-- Banner fixo no rodapé -->
<div id="custom-footer">
  <a href="https://8xbet86.com/" target="_blank" rel="noopener noreferrer">
    <img src="https://i.imgur.com/Fen20UR.gif" 
         style="width:100%;max-height:100px;object-fit:contain;cursor:pointer;" 
         alt="Banner" />
  </a>
</div>

<style>
  #custom-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: transparent;
    text-align: center;
    z-index: 9999;
  }
  body { 
    padding-bottom: 120px !important; 
  }
</style>

<!-- Script PopIn -->
<script>
document.addEventListener("DOMContentLoaded", function() {
  var crakPopInParamsIframe = {
    url: 'https://t.mbsrv2.com/273605/10163/optimized?aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0016&aff_id=1&transaction_id=postitial',
    decryptUrl: false,
    contentUrl: 'https://t.mbsrv2.com/273605/10163/optimized?aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0016&aff_id=1&transaction_id=postitial',
    decryptContentUrl: false,
    contentType: 'iframe',
    width: '85%',
    height: '85%',
    timeout: false,
    delayClose: 0,
    clickStart: false,
    closeIntent: false,
    postitialBehavior: true,
    closeButtonColor: '#000',
    closeCrossColor: '#fff',
    shadow: true,
    shadowColor: '#000',
    shadowOpacity: '.5',
    shadeColor: '#111',
    shadeOpacity: '0',
    border: '1px',
    borderColor: '#000',
    borderRadius: '0px',
    leadOut: true,
    animation: 'slide',
    direction: 'up',
    verticalPosition: 'center',
    horizontalPosition: 'center',
    expireDays: 0.01
  };

  var script = document.createElement('script');
  script.src = "https://crxcr1.com/popin/latest/popin-min.js";
  document.body.appendChild(script);
});
</script>
`;
}
