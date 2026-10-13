package hu.campus.lostfound.admin;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AdminAccessTest {

    @Test
    void matchesConfiguredEmailCaseInsensitively() {
        AdminAccess adminAccess = new AdminAccess("Anna@Example.com, bence@example.com");

        assertThat(adminAccess.isAdmin("anna@example.com")).isTrue();
        assertThat(adminAccess.isAdmin("ANNA@EXAMPLE.COM")).isTrue();
    }

    @Test
    void rejectsEmailNotInList() {
        AdminAccess adminAccess = new AdminAccess("anna@example.com");

        assertThat(adminAccess.isAdmin("csenge@example.com")).isFalse();
    }

    @Test
    void blankConfigAdminsNoOne() {
        AdminAccess adminAccess = new AdminAccess("");

        assertThat(adminAccess.isAdmin("anna@example.com")).isFalse();
    }

    @Test
    void nullEmailIsNeverAdmin() {
        AdminAccess adminAccess = new AdminAccess("anna@example.com");

        assertThat(adminAccess.isAdmin(null)).isFalse();
    }
}
