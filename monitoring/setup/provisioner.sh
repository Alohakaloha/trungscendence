#!/usr/bin/env bash

apt update && apt install curl -y

curl -s --cacert /usr/share/elasticsearch/config/certs/ca/ca.crt \
-X PUT "https://es01:9200/_ilm/policy/trans_policy?pretty" \
-H 'Content-Type: application/json' \
-H "Authorization: Basic ZWxhc3RpYzphYWFhYWE=" \
-d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_primary_shard_size": "25GB" 
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {} 
        }
      }
    }
  }
}
' -v
