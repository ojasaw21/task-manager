package com.taskmanager.config;

import com.taskmanager.entity.*;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

import org.springframework.context.annotation.Profile;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        // Create admin
        User admin = userRepository.save(User.builder()
                .name("Admin User")
                .email("admin@taskmanager.com")
                .password(passwordEncoder.encode("Admin123!"))
                .role(User.Role.ADMIN)
                .build());

        // Create members
        User alice = userRepository.save(User.builder()
                .name("Alice Johnson")
                .email("alice@taskmanager.com")
                .password(passwordEncoder.encode("Member123!"))
                .role(User.Role.MEMBER)
                .build());

        User bob = userRepository.save(User.builder()
                .name("Bob Smith")
                .email("bob@taskmanager.com")
                .password(passwordEncoder.encode("Member123!"))
                .role(User.Role.MEMBER)
                .build());

        User carol = userRepository.save(User.builder()
                .name("Carol White")
                .email("carol@taskmanager.com")
                .password(passwordEncoder.encode("Member123!"))
                .role(User.Role.MEMBER)
                .build());

        // Create projects
        Project p1 = projectRepository.save(Project.builder()
                .name("Website Redesign")
                .description("Complete overhaul of company website with modern design and improved UX.")
                .status(Project.Status.ACTIVE)
                .deadline(LocalDate.now().plusDays(30))
                .createdBy(admin)
                .build());

        Project p2 = projectRepository.save(Project.builder()
                .name("Mobile App v2.0")
                .description("Second version of the mobile application with new features and performance improvements.")
                .status(Project.Status.ACTIVE)
                .deadline(LocalDate.now().plusDays(60))
                .createdBy(admin)
                .build());

        Project p3 = projectRepository.save(Project.builder()
                .name("API Integration")
                .description("Integrate third-party payment and notification APIs.")
                .status(Project.Status.ON_HOLD)
                .deadline(LocalDate.now().plusDays(15))
                .createdBy(admin)
                .build());

        // Add members to projects
        projectMemberRepository.save(ProjectMember.builder().project(p1).user(alice).build());
        projectMemberRepository.save(ProjectMember.builder().project(p1).user(bob).build());
        projectMemberRepository.save(ProjectMember.builder().project(p2).user(alice).build());
        projectMemberRepository.save(ProjectMember.builder().project(p2).user(carol).build());
        projectMemberRepository.save(ProjectMember.builder().project(p3).user(bob).build());
        projectMemberRepository.save(ProjectMember.builder().project(p3).user(carol).build());

        // Create tasks for project 1
        taskRepository.save(Task.builder().title("Design new homepage mockup").description("Create Figma mockups for homepage.").status(Task.Status.DONE).priority(Task.Priority.HIGH).project(p1).assignee(alice).createdBy(admin).dueDate(LocalDate.now().minusDays(5)).build());
        taskRepository.save(Task.builder().title("Implement responsive navbar").description("Build mobile-friendly navigation component.").status(Task.Status.IN_PROGRESS).priority(Task.Priority.HIGH).project(p1).assignee(bob).createdBy(admin).dueDate(LocalDate.now().plusDays(3)).build());
        taskRepository.save(Task.builder().title("SEO optimization").description("Add meta tags, schema markup and improve page speed.").status(Task.Status.TODO).priority(Task.Priority.MEDIUM).project(p1).assignee(alice).createdBy(admin).dueDate(LocalDate.now().plusDays(10)).build());
        taskRepository.save(Task.builder().title("Content migration").description("Move all existing content to new CMS.").status(Task.Status.REVIEW).priority(Task.Priority.MEDIUM).project(p1).assignee(bob).createdBy(admin).dueDate(LocalDate.now().plusDays(7)).build());
        taskRepository.save(Task.builder().title("Performance testing").description("Run lighthouse audits and fix issues.").status(Task.Status.TODO).priority(Task.Priority.LOW).project(p1).assignee(null).createdBy(admin).dueDate(LocalDate.now().plusDays(25)).build());

        // Create tasks for project 2
        taskRepository.save(Task.builder().title("Setup push notifications").description("Integrate Firebase Cloud Messaging.").status(Task.Status.IN_PROGRESS).priority(Task.Priority.CRITICAL).project(p2).assignee(carol).createdBy(admin).dueDate(LocalDate.now().plusDays(5)).build());
        taskRepository.save(Task.builder().title("User profile redesign").description("Update the user profile screens.").status(Task.Status.TODO).priority(Task.Priority.HIGH).project(p2).assignee(alice).createdBy(admin).dueDate(LocalDate.now().plusDays(12)).build());
        taskRepository.save(Task.builder().title("Fix login bug on iOS").description("Login fails on iOS 16+ devices.").status(Task.Status.REVIEW).priority(Task.Priority.CRITICAL).project(p2).assignee(carol).createdBy(admin).dueDate(LocalDate.now().minusDays(2)).build());
        taskRepository.save(Task.builder().title("Dark mode support").description("Add system-level dark mode support.").status(Task.Status.TODO).priority(Task.Priority.MEDIUM).project(p2).assignee(null).createdBy(admin).dueDate(LocalDate.now().plusDays(45)).build());

        // Create tasks for project 3
        taskRepository.save(Task.builder().title("Stripe payment integration").description("Implement Stripe checkout flow.").status(Task.Status.TODO).priority(Task.Priority.CRITICAL).project(p3).assignee(bob).createdBy(admin).dueDate(LocalDate.now().minusDays(3)).build());
        taskRepository.save(Task.builder().title("Email notification service").description("Setup SendGrid for transactional emails.").status(Task.Status.IN_PROGRESS).priority(Task.Priority.HIGH).project(p3).assignee(carol).createdBy(admin).dueDate(LocalDate.now().plusDays(8)).build());

        log.info("✅ Demo data seeded successfully!");
        log.info("📧 Admin: admin@taskmanager.com / Admin123!");
        log.info("📧 Members: alice@taskmanager.com, bob@taskmanager.com, carol@taskmanager.com / Member123!");
    }
}
