package hu.campus.lostfound.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import hu.campus.lostfound.shared.BadRequestException;
import org.junit.jupiter.api.Test;

/**
 * Only covers configuration checks and the fast-fail path. Does not call the real DeepSeek API.
 */
class CategorySuggestionServiceTest {

    @Test
    void isConfiguredTrueWhenApiKeyPresent() {
        CategorySuggestionService service = new CategorySuggestionService(
                "sk-test", "https://api.deepseek.com", "deepseek-chat", new ObjectMapper()
        );

        assertThat(service.isConfigured()).isTrue();
    }

    @Test
    void isConfiguredFalseWhenApiKeyBlank() {
        CategorySuggestionService service = new CategorySuggestionService(
                "  ", "https://api.deepseek.com", "deepseek-chat", new ObjectMapper()
        );

        assertThat(service.isConfigured()).isFalse();
    }

    @Test
    void suggestFailsFastWhenNotConfiguredWithoutCallingTheApi() {
        CategorySuggestionService service = new CategorySuggestionService(
                "", "https://api.deepseek.com", "deepseek-chat", new ObjectMapper()
        );

        assertThatThrownBy(() -> service.suggest(new SuggestCategoryRequest("Blue backpack", null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Category suggestion is not configured on the server");
    }
}
