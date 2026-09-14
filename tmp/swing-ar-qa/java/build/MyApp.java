import java.awt.*;
import javax.swing.*;

public class MyApp {

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("My App");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setLayout(new BorderLayout(8, 8));

            JLabel label1 = new JLabel("My App");
            frame.add(label1, BorderLayout.NORTH);

            JTextField textField1 = new JTextField(10);
            frame.add(textField1, BorderLayout.CENTER);

            JButton button1 = new JButton("Click Me");
            frame.add(button1, BorderLayout.SOUTH);

            frame.setSize(260, 300); // includes the title bar
            frame.setVisible(true);
        });
    }
}