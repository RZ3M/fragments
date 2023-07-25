# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# We're sending an unsupported/type fragment
Content-Type: unsupported/type
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request goes in ```...``` when it's a string
`This is a fragment!`

# 1. We expect to get back an HTTP 415
HTTP/1.1 415

# various assertions 
[Asserts]
# Status
jsonpath "$.status" == "error"
# Error code is equal to 415
jsonpath "$.error.code" == 415
# error message
jsonpath "$.error.message" == "Unsupported data type."
