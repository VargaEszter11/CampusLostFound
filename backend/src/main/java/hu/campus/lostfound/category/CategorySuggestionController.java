package hu.campus.lostfound.category;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategorySuggestionController {

    private final CategorySuggestionService categorySuggestionService;

    public CategorySuggestionController(CategorySuggestionService categorySuggestionService) {
        this.categorySuggestionService = categorySuggestionService;
    }

    @PostMapping("/suggest")
    public SuggestCategoryResponse suggest(@Valid @RequestBody SuggestCategoryRequest request) {
        return categorySuggestionService.suggest(request);
    }
}
