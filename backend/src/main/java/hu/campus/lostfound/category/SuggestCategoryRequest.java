package hu.campus.lostfound.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SuggestCategoryRequest(
        @NotBlank @Size(max = 255) String itemName,
        @Size(max = 4000) String itemDescription
) {
}
