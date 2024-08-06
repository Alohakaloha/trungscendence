https://localhost/oauth2/redirect/?code=ad832eaf751c02261c7c43aedbb9e07622c388969ae029aba69d39f65d62457f



b'grant_type=authorization_code&client_id=u-s4t2ud-57ba516266a82e9f763e1c0584d4d2c7b770338a9fc862271db5bb4479a4b319&client_secret=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&redirect_uri=https%3A%2F%2Flocalhost%2Foauth2%2Fredirect%2F&code=4a8950f017c5db29a30bc713deaaa42261113bbd117c6fe2dff623e1edfa0775'


curl -H "Content-Type: application/json" -d '{"grant_type": "authorization_code", "client_id": "u-s4t2ud-57ba516266a82e9f763e1c0584d4d2c7b770338a9fc862271db5bb4479a4b319", "client_secret": "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", "redirect_uri": "https://localhost/oauth2/redirect/", "code": "3a62c94c20428d0f792ef4cd9b9a7c6acf0d1f8d618581ebddb457ea9a838335"}' -X POST "https://api.intra.42.fr/oauth/token"

->

client_secret": "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", "redirect_uri": "https://localhost/oauth2/redirect/", "code": "3a62c94c20428d0f792ef4cd9b9a7c6acf0d1f8d618581ebddb457ea9a838335"}' -X POST "https://api.intra.42.fr/oauth/token"
{"access_token":"6d3d59d6ed52672fdfd8ff3c086bca08014cb2d140bbf720a094f27968c3ee9a","token_type":"bearer","expires_in":3105,"refresh_token":"a0ddde9bf1165d8ee84961148e6be2a41f78d74aae9c8f9e8d0aaf0c0423792b","scope":"publi