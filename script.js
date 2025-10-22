document.addEventListener('DOMContentLoaded', () => {
    const ocrForm = document.getElementById('ocr-form');
    const fileInput = document.getElementById('file-input');
    const statusDiv = document.getElementById('status');
    const resultText = document.getElementById('result-text');
    const copyButton = document.getElementById('copy-button');

    ocrForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            statusDiv.textContent = 'कृपया एक फाइल चुनें।';
            statusDiv.style.color = 'red';
            return;
        }

        // फाइल को Base64 में बदलने के लिए फंक्शन
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]); // सिर्फ base64 डेटा भेजें
            reader.onerror = error => reject(error);
        });

        statusDiv.textContent = 'प्रोसेसिंग... कृपया प्रतीक्षा करें।';
        statusDiv.style.color = 'orange';
        resultText.value = '';
        copyButton.style.display = 'none';

        try {
            const base64File = await toBase64(file);
            const fileType = file.type;

            // Netlify फंक्शन को कॉल करें
            const response = await fetch('/.netlify/functions/ocr', {
                method: 'POST',
                body: JSON.stringify({
                    file: base64File,
                    type: fileType,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API से कोई जवाब नहीं मिला।');
            }

            const data = await response.json();
            
            resultText.value = data.text;
            resultText.readOnly = false; // अब टेक्स्ट को एडिट किया जा सकता है
            statusDiv.textContent = 'टेक्स्ट सफलतापूर्वक निकाला गया!';
            statusDiv.style.color = 'green';
            copyButton.style.display = 'block';

        } catch (error) {
            statusDiv.textContent = `एक त्रुटि हुई: ${error.message}`;
            statusDiv.style.color = 'red';
        }
    });

    copyButton.addEventListener('click', () => {
        resultText.select();
        document.execCommand('copy');
        statusDiv.textContent = 'टेक्स्ट कॉपी हो गया!';
        setTimeout(() => {
            statusDiv.textContent = 'टेक्स्ट सफलतापूर्वक निकाला गया!';
        }, 2000);
    });
});
