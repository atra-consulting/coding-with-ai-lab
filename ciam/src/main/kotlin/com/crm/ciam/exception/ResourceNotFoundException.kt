package com.crm.ciam.exception

class ResourceNotFoundException(entity: String, id: Long) :
    RuntimeException("$entity mit ID $id nicht gefunden")
