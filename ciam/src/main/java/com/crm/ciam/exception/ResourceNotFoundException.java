package com.crm.ciam.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String entity, Long id) {
        super(entity + " mit ID " + id + " nicht gefunden");
    }
}
